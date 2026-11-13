import React from 'react';
import { SystemNotification } from '../types';
import { Bell, AlertTriangle, Award, CheckCircle2, X } from 'lucide-react';

interface NotificationBannerProps {
  notifications: SystemNotification[];
  onDismiss?: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss,
}) => {
  const latest = notifications[0];
  if (!latest) return null;

  const isRecent = Date.now() - latest.timestamp < 12000;
  if (!isRecent) return null;

  const cornerBg =
    latest.corner === 'red'
      ? 'border-red-500/50 bg-red-950/80 text-red-200'
      : latest.corner === 'blue'
      ? 'border-blue-500/50 bg-blue-950/80 text-blue-200'
      : 'border-purple-500/50 bg-purple-950/80 text-purple-200';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-bounce-short">
      <div
        className={`flex items-start gap-3 rounded-lg border p-3.5 shadow-2xl backdrop-blur-md transition-all ${cornerBg}`}
      >
        <div className="p-1 rounded-md bg-white/10 shrink-0">
          {latest.type === 'penalty' ? (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          ) : latest.type === 'point' ? (
            <Award className="h-5 w-5 text-emerald-400" />
          ) : latest.type === 'verification' ? (
            <AlertTriangle className="h-5 w-5 text-yellow-300 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-purple-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {latest.title}
            </h4>
            <span className="text-[10px] text-white/60">Baru saja</span>
          </div>
          <p className="text-xs text-white/90 mt-0.5 line-clamp-2">{latest.message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(latest.id)}
            className="text-white/60 hover:text-white p-1"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
