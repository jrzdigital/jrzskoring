import React, { useState } from 'react';
import { ScoreEvent, CornerColor } from '../types/silat';
import { formatTime } from '../utils/rules';
import { History, Undo2, Filter, AlertCircle, Shield } from 'lucide-react';

interface ActivityLogProps {
  events: ScoreEvent[];
  onUndoEvent: (eventId: string) => void;
  redName: string;
  blueName: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  events,
  onUndoEvent,
  redName,
  blueName,
}) => {
  const [filterCorner, setFilterCorner] = useState<'all' | CornerColor>('all');

  const filteredEvents = events.filter((ev) => {
    if (filterCorner === 'all') return true;
    return ev.corner === filterCorner;
  });

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
      {/* Header with Title & Filter Controls */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-neutral-600" />
          <h3 className="text-sm font-bold text-neutral-900">
            Log Pencatatan Nilai Real-Time ({events.length} Catatan)
          </h3>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilterCorner('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterCorner === 'all'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterCorner('red')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterCorner === 'red'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-red-700'
            }`}
          >
            Merah
          </button>
          <button
            onClick={() => setFilterCorner('blue')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterCorner === 'blue'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-blue-700'
            }`}
          >
            Biru
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Belum ada catatan nilai atau hukuman pada partai ini.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const isRed = ev.corner === 'red';
            return (
              <div
                key={ev.id ? `${ev.id}-${idx}` : `ev-${idx}`}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50 rounded-lg px-2 transition-colors"
              >
                {/* Event info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Timestamp & Round */}
                  <span className="font-mono text-[11px] text-neutral-400 tabular-nums shrink-0">
                    B{ev.round} · {formatTime(ev.matchTimeSeconds)}
                  </span>

                  {/* Corner indicator */}
                  <span
                    className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      isRed
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isRed ? 'Merah' : 'Biru'}
                  </span>

                  {/* Description */}
                  <div className="truncate">
                    <span className="font-semibold text-neutral-800">
                      {ev.label}
                    </span>
                    {ev.judgesInvolved && ev.judgesInvolved.length > 0 && (
                      <span className="text-[10px] text-neutral-400 ml-1.5 font-normal">
                        (Juri {ev.judgesInvolved.join(', ')})
                      </span>
                    )}
                    {ev.notes && (
                      <span className="text-[10px] text-neutral-500 italic ml-1.5">
                        · {ev.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points & Undo */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono font-bold text-sm tabular-nums ${
                      ev.points > 0
                        ? isRed
                          ? 'text-red-600'
                          : 'text-blue-600'
                        : ev.points < 0
                        ? 'text-red-700'
                        : 'text-neutral-500'
                    }`}
                  >
                    {ev.points > 0 ? `+${ev.points}` : ev.points === 0 ? '0' : ev.points}
                  </span>

                  <button
                    onClick={() => onUndoEvent(ev.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 rounded transition-colors"
                    title="Batalkan (Hapus) catatan ini"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
