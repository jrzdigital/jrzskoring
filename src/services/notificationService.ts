/**
 * Notification Service untuk Notifikasi Real-Time Pertandingan Pencak Silat
 * Memberikan peringatan instan kepada Operator, Dewan, dan panitia mengenai:
 * - Dimulainya ronde / partai baru
 * - Adanya jeda (pause)
 * - Pertandingan selesai (finish / gong)
 * - Hasil sementara & juri submit nilai
 * - Pengesahan nilai oleh dewan
 */

export type NotificationType = 'start' | 'pause' | 'finish' | 'score' | 'dewan' | 'sync' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  partaiId?: string;
  nomorPartai?: number;
  timestamp: number;
  read: boolean;
}

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Set<(notifications: AppNotification[], latest?: AppNotification) => void> = new Set();
  private readonly STORAGE_KEY = 'silat_realtime_notifications';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          this.notifications = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to parse notifications', e);
      }
    }
  }

  public subscribe(callback: (notifications: AppNotification[], latest?: AppNotification) => void): () => void {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public addNotification(type: NotificationType, title: string, message: string, meta?: { partaiId?: string; nomorPartai?: number }) {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      message,
      partaiId: meta?.partaiId,
      nomorPartai: meta?.nomorPartai,
      timestamp: Date.now(),
      read: false,
    };

    // Keep max 50 recent notifications
    this.notifications = [newNotif, ...this.notifications].slice(0, 50);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Storage set failed for notification', e);
    }

    this.notify(newNotif);
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {}
    this.notify();
  }

  public clearAll() {
    this.notifications = [];
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
    this.notify();
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private notify(latest?: AppNotification) {
    this.listeners.forEach(cb => {
      try {
        cb(this.notifications, latest);
      } catch (e) {
        console.error('Notification listener error', e);
      }
    });
  }
}

export const notificationService = new NotificationService();
