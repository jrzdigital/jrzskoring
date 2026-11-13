/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer, IncomingMessage } from "http";
import type { Socket } from "net";
import { MatchState } from "../types";

export interface ConnectedPeer {
  id: string; // unique device or socket id
  deviceId: string;
  role: string; // "SERVER" | "JURI_1" | "JURI_2" | "JURI_3" | "DEWAN" | "OPERATOR" | "SEKRETARIS" | "SCOREBOARD"
  arena: string;
  ip: string;
  transport: "webrtc" | "websocket";
  connectedAt: number;
  lastPing: number;
  latencyMs?: number;
  ws: WebSocket;
}

export type ActionHandler = (action: string, payload: any, senderId: string) => MatchState | null | Promise<MatchState | null>;

class WebRtcSignalingServer {
  private wss: WebSocketServer | null = null;
  private peers: Map<string, ConnectedPeer> = new Map();
  private actionHandler: ActionHandler | null = null;
  private currentMatchStateGetter: (() => MatchState) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  public init(
    server: HttpServer,
    getMatchState: () => MatchState,
    onAction: ActionHandler
  ) {
    this.currentMatchStateGetter = getMatchState;
    this.actionHandler = onAction;

    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
      try {
        const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
        if (url.pathname === "/ws" || url.pathname === "/webrtc-signaling") {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit("connection", ws, request);
          });
        }
      } catch (err) {
        console.error("[WEBRTC_SIGNAL] Upgrade error:", err);
        socket.destroy();
      }
    });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      if (Array.isArray(clientIp)) clientIp = clientIp[0];
      if (typeof clientIp === "string" && clientIp.includes(",")) clientIp = clientIp.split(",")[0].trim();
      if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") clientIp = "127.0.0.1";

      const peerId = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const peer: ConnectedPeer = {
        id: peerId,
        deviceId: peerId,
        role: "GUEST",
        arena: "A",
        ip: clientIp as string,
        transport: "websocket",
        connectedAt: Date.now(),
        lastPing: Date.now(),
        ws
      };

      this.peers.set(peerId, peer);

      // Send initial welcome message with server peer ID and current match state
      this.sendTo(ws, {
        type: "welcome",
        peerId,
        serverTime: Date.now(),
        activePeersCount: this.peers.size,
        state: this.currentMatchStateGetter ? this.currentMatchStateGetter() : null
      });

      // Broadcast updated peer list
      this.broadcastPeerList();

      ws.on("message", async (raw: string | Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          await this.handleClientMessage(peer, msg);
        } catch (err) {
          console.error(`[WEBRTC_SIGNAL] Error handling message from ${peer.id}:`, err);
        }
      });

      ws.on("close", () => {
        this.peers.delete(peerId);
        this.broadcastPeerList();
      });

      ws.on("error", (err) => {
        console.warn(`[WEBRTC_SIGNAL] Peer socket error (${peer.id}):`, err);
        this.peers.delete(peerId);
        this.broadcastPeerList();
      });
    });

    // Keepalive ping every 4 seconds to detect Wi-Fi drops on mixed 2.4GHz/5GHz
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      this.peers.forEach((peer, id) => {
        if (peer.ws.readyState === WebSocket.OPEN) {
          try {
            peer.ws.ping();
          } catch (e) {}
        } else if (peer.ws.readyState === WebSocket.CLOSED || peer.ws.readyState === WebSocket.CLOSING) {
          this.peers.delete(id);
        }
      });
    }, 4000);

    console.log("[WEBRTC_SIGNAL] WebRTC Signaling & WebSocket Engine initialized on /ws");
  }

  private async handleClientMessage(peer: ConnectedPeer, msg: any) {
    if (!msg || !msg.type) return;

    peer.lastPing = Date.now();

    switch (msg.type) {
      // 1. Peer Registration
      case "register": {
        if (msg.role) peer.role = msg.role;
        if (msg.deviceId) peer.deviceId = msg.deviceId;
        if (msg.arena) peer.arena = msg.arena;
        if (msg.transport) peer.transport = msg.transport;

        this.sendTo(peer.ws, {
          type: "registered",
          peerId: peer.id,
          role: peer.role,
          deviceId: peer.deviceId,
          state: this.currentMatchStateGetter ? this.currentMatchStateGetter() : null
        });

        this.broadcastPeerList();
        break;
      }

      // 2. WebRTC Signaling Relaying (SDP Offer, Answer, ICE Candidates)
      // Enables direct P2P data channels between mixed 2.4GHz / 5GHz devices!
      case "webrtc:signal": {
        const { targetId, signal, senderId } = msg;
        if (targetId) {
          // Send to specific peer by peerId or deviceId
          const target = this.findPeer(targetId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            this.sendTo(target.ws, {
              type: "webrtc:signal",
              senderId: senderId || peer.id,
              senderRole: peer.role,
              senderDeviceId: peer.deviceId,
              signal
            });
          }
        } else {
          // Broadcast signal to all other peers (useful for discovery / mesh)
          this.peers.forEach((p) => {
            if (p.id !== peer.id && p.ws.readyState === WebSocket.OPEN) {
              this.sendTo(p.ws, {
                type: "webrtc:signal",
                senderId: peer.id,
                senderRole: peer.role,
                senderDeviceId: peer.deviceId,
                signal
              });
            }
          });
        }
        break;
      }

      // 3. Ping / Pong latency measurement
      case "ping": {
        this.sendTo(peer.ws, {
          type: "pong",
          clientTimestamp: msg.clientTimestamp,
          serverTimestamp: Date.now()
        });
        break;
      }

      // 4. Action Dispatching (Jury presses, votes, timer, score edits)
      case "action": {
        if (this.actionHandler && msg.action) {
          const updatedState = await this.actionHandler(msg.action, msg.payload, peer.id);
          if (updatedState) {
            this.broadcastMatchState(updatedState);
          }
        }
        break;
      }

      // 5. Direct state update broadcast request
      case "state:sync": {
        if (msg.state) {
          if (this.actionHandler) {
            const updated = await this.actionHandler("STATE_UPDATE", msg.state, peer.id);
            if (updated) this.broadcastMatchState(updated);
          } else {
            this.broadcastMatchState(msg.state);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  private findPeer(idOrDeviceId: string): ConnectedPeer | undefined {
    if (this.peers.has(idOrDeviceId)) {
      return this.peers.get(idOrDeviceId);
    }
    for (const peer of this.peers.values()) {
      if (peer.deviceId === idOrDeviceId || peer.role === idOrDeviceId) {
        return peer;
      }
    }
    return undefined;
  }

  public broadcastMatchState(state: MatchState) {
    const payload = JSON.stringify({
      type: "state:update",
      timestamp: Date.now(),
      state
    });

    this.peers.forEach((peer) => {
      if (peer.ws.readyState === WebSocket.OPEN) {
        try {
          peer.ws.send(payload);
        } catch (e) {
          // Socket write failed, will be pruned
        }
      }
    });
  }

  public broadcastPeerList() {
    const peerSummary = Array.from(this.peers.values()).map((p) => ({
      id: p.id,
      deviceId: p.deviceId,
      role: p.role,
      arena: p.arena,
      ip: p.ip,
      transport: p.transport,
      connectedAt: p.connectedAt,
      lastPing: p.lastPing
    }));

    const payload = JSON.stringify({
      type: "peers:list",
      peers: peerSummary,
      count: peerSummary.length
    });

    this.peers.forEach((peer) => {
      if (peer.ws.readyState === WebSocket.OPEN) {
        try {
          peer.ws.send(payload);
        } catch (e) {}
      }
    });
  }

  public getConnectedPeersList(): Array<Omit<ConnectedPeer, "ws">> {
    return Array.from(this.peers.values()).map(({ ws, ...rest }) => rest);
  }

  private sendTo(ws: WebSocket, obj: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(obj));
      } catch (err) {
        console.warn("[WEBRTC_SIGNAL] Failed to send to socket:", err);
      }
    }
  }

  public destroy() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.peers.clear();
  }
}

export const webrtcSignalingServer = new WebRtcSignalingServer();
