/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EventScopeModal
 * Pengaturan Ruang Lingkup Event & Server Utama Offline Lokal.
 * Memastikan Event A dan Event B terisolasi 100% dan tidak saling mengganggu.
 */

import React, { useState, useEffect } from "react";
import { Server, ShieldCheck, Plus, Check, RefreshCw, X, Database, Laptop, Info } from "lucide-react";
import { eventScopeManager, EventProfile } from "../services/eventScopeManager";
import { sound } from "../utils/sound";

interface EventScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventScopeModal({ isOpen, onClose }: EventScopeModalProps) {
  const [activeEventId, setActiveEventId] = useState(() => eventScopeManager.getActiveEventId());
  const [activeEventName, setActiveEventName] = useState(() => eventScopeManager.getActiveEventName());
  const [profiles, setProfiles] = useState<EventProfile[]>(() => eventScopeManager.getEventProfiles());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventId, setNewEventId] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [serverInstanceId, setServerInstanceId] = useState(() => eventScopeManager.getServerInstanceId());

  useEffect(() => {
    if (isOpen) {
      setActiveEventId(eventScopeManager.getActiveEventId());
      setActiveEventName(eventScopeManager.getActiveEventName());
      setProfiles(eventScopeManager.getEventProfiles());
      setServerInstanceId(eventScopeManager.getServerInstanceId());
      setIsCreatingNew(false);
      setNewEventId("");
      setNewEventName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectEvent = (profile: EventProfile) => {
    sound.playClick();
    eventScopeManager.switchEvent(profile.id, profile.name);
    setActiveEventId(profile.id);
    setActiveEventName(profile.name);
    setProfiles(eventScopeManager.getEventProfiles());
    onClose();
  };

  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    sound.playClick();
    const createdId = eventScopeManager.createNewEvent(newEventName, newEventId || undefined);
    setActiveEventId(createdId);
    setActiveEventName(newEventName.trim());
    setProfiles(eventScopeManager.getEventProfiles());
    setIsCreatingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#071126] border border-cyan-500/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/30 bg-[#091633]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                PENGATURAN CLOUD &amp; RUANG EVENT
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">
                Firebase Realtime Database &amp; Isolasi Database Event
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Status Firebase Cloud Card */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-300 uppercase">MODE: ONLINE FIREBASE REALTIME DATABASE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  CLOUD AKTIF
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Aplikasi terhubung langsung secara online ke <strong>Firebase Realtime Database (jrz-score)</strong>. Seluruh data pertandingan, atlet, dan penilaian tersinkron real-time antar perangkat di ruang event ini.
              </p>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <span>ID Sesi Cloud:</span>
                <span className="text-slate-200 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-slate-700">
                  {serverInstanceId}
                </span>
              </div>
            </div>
          </div>

          {/* Banner Info Isolasi Event */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px] leading-snug">
              Setiap event memiliki ruang database dan kanal terpisah. <strong>Event A tidak akan mengganggu atau bercampur dengan Event B</strong>.
            </span>
          </div>

          {/* List Event Tersimpan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                PILIH EVENT AKTIF:
              </span>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsCreatingNew(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Buat Event Baru</span>
                </button>
              )}
            </div>

            {/* List Profile Cards */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {profiles.map((p) => {
                const isActive = p.id === activeEventId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectEvent(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-slate-600"}`} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-white truncate">{p.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/40 text-cyan-300 border border-cyan-500/30">
                            {p.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Database & jadwal terisolasi mandiri
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        AKTIF
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Buat Event Baru */}
          {isCreatingNew && (
            <form onSubmit={handleCreateNewEvent} className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase">Input Data Event Baru</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kejuaraan / Event</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kejuaraan Silat Antar Pelajar 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">ID Event Unik (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: EVENT-B (Kosongkan untuk auto-generate)"
                  value={newEventId}
                  onChange={(e) => setNewEventId(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="mt-1 px-4 py-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-95"
              >
                Buat & Aktifkan Event Ini
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#060c1d] flex items-center justify-between text-xs text-slate-400">
          <span>Event Aktif: <strong className="text-cyan-300">{activeEventId}</strong></span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
