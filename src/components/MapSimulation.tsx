import React from 'react';
import { MapPin, Navigation, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';

interface MapSimulationProps {
  pickupCoords?: { x: number; y: number } | null;
  dropoffCoords?: { x: number; y: number } | null;
  driverCoords?: { x: number; y: number } | null;
  driverType?: 'motor' | 'mobil' | null;
  status?: 'searching' | 'accepted' | 'arrived' | 'enroute' | 'completed' | 'cancelled' | 'idle';
  serviceType?: string;
}

export default function MapSimulation({
  pickupCoords,
  dropoffCoords,
  driverCoords,
  driverType = 'motor',
  status = 'idle',
  serviceType = 'jekride',
}: MapSimulationProps) {
  // Simple static road grid network lines to draw on background
  const roads = [
    // Vertical Main roads
    { x1: 20, y1: 5, x2: 20, y2: 95, name: 'Jl. Letjen S. Parman' },
    { x1: 50, y1: 5, x2: 50, y2: 95, name: 'Jl. M.H. Thamrin - Sudirman' },
    { x1: 80, y1: 5, x2: 80, y2: 95, name: 'Jl. Rasuna Said' },
    // Horizontal main roads
    { x1: 5, y1: 20, x2: 95, y2: 20, name: 'Jl. Jenderal Gatot Subroto' },
    { x1: 5, y1: 50, x2: 95, y2: 50, name: 'Jl. Prof. Dr. Satrio' },
    { x1: 5, y1: 80, x2: 95, y2: 80, name: 'Jl. Pangeran Antasari' },
    // Diagonals for flavor
    { x1: 20, y1: 20, x2: 50, y2: 50, name: 'Sudirman Connector' },
    { x1: 50, y1: 50, x2: 80, y2: 80, name: 'Kuningan Link' },
  ];

  return (
    <div className="relative w-full h-full bg-[#f1f5f9] overflow-hidden rounded-2xl border border-slate-200 shadow-inner flex flex-col justify-end select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-60"></div>

      {/* Map SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* River Water Graphic */}
        <path
          d="M -10,30 Q 30,25 45,55 T 110,80 L 110,95 L -10,95 Z"
          fill="#bfdbfe"
          opacity="0.6"
        />

        {/* Parks */}
        <rect x="42" y="10" width="16" height="12" rx="3" fill="#bbf7d0" opacity="0.7" />
        <circle cx="50" cy="15" r="3" fill="#86efac" opacity="0.6" />

        {/* Roads drawing */}
        {roads.map((road, idx) => (
          <g key={idx}>
            <line
              x1={road.x1}
              y1={road.y1}
              x2={road.x2}
              y2={road.y2}
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1={road.x1}
              y1={road.y1}
              x2={road.x2}
              y2={road.y2}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2,2"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Route Line (Pulsing Path between pickup and dropoff) */}
        {pickupCoords && dropoffCoords && (status === 'accepted' || status === 'arrived' || status === 'enroute') && (
          <>
            {/* Outline route */}
            <path
              d={`M ${pickupCoords.x} ${pickupCoords.y} L ${pickupCoords.x} ${dropoffCoords.y} L ${dropoffCoords.x} ${dropoffCoords.y}`}
              fill="none"
              stroke="#FF6B00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            />
            {/* Animated dashed line */}
            <path
              d={`M ${pickupCoords.x} ${pickupCoords.y} L ${pickupCoords.x} ${dropoffCoords.y} L ${dropoffCoords.x} ${dropoffCoords.y}`}
              fill="none"
              stroke="#FF6B00"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4,4"
              className="animate-[dash_2s_linear_infinite]"
              style={{
                strokeDashoffset: 10,
              }}
            />
          </>
        )}

        {/* Connections/Breadcrumb for driver to pickup */}
        {driverCoords && pickupCoords && (status === 'accepted' || status === 'arrived') && (
          <line
            x1={driverCoords.x}
            y1={driverCoords.y}
            x2={pickupCoords.x}
            y2={pickupCoords.y}
            stroke="#1B264F"
            strokeWidth="1.2"
            strokeDasharray="3,3"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Simulated labels/landmarks overlay */}
      <div className="absolute top-3 left-4 text-[9px] font-semibold text-slate-700 bg-white/90 px-2.5 py-1 rounded-full backdrop-blur-sm shadow border border-slate-200/60">
        📍 Jakarta Pusat (Simulasi JekExpress)
      </div>

      {/* Legend & Instructions on map */}
      <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[9px] text-slate-700 bg-white/90 px-2.5 py-1 rounded-full backdrop-blur-sm border border-slate-200/60 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span>GPS Online</span>
      </div>

      {/* MAP MARKERS (USING ABSOLUTE DIV OVERLAYS FOR BEAUTIFUL ICONS) */}

      {/* 1. Pickup Pin */}
      {pickupCoords && (status === 'searching' || status === 'accepted' || status === 'arrived' || status === 'enroute') && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 flex flex-col items-center"
          style={{ left: `${pickupCoords.x}%`, top: `${pickupCoords.y}%` }}
        >
          <div className="relative">
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-500/30 animate-ping transform -translate-x-1 -translate-y-1"></span>
            <div className="bg-emerald-600 border border-white text-white p-1.5 rounded-full shadow-lg">
              {serviceType === 'jekfood' ? (
                <ShoppingBag size={11} className="text-white" />
              ) : (
                <MapPin size={11} className="text-white font-bold" />
              )}
            </div>
          </div>
          <span className="mt-0.5 px-1.5 py-0.5 bg-white text-[7px] text-emerald-600 font-bold rounded shadow border border-emerald-100 whitespace-nowrap">
            {serviceType === 'jekfood' ? 'Restoran' : 'Jemput'}
          </span>
        </div>
      )}

      {/* 2. Dropoff Pin */}
      {dropoffCoords && (status === 'searching' || status === 'accepted' || status === 'arrived' || status === 'enroute' || status === 'completed') && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 flex flex-col items-center"
          style={{ left: `${dropoffCoords.x}%`, top: `${dropoffCoords.y}%` }}
        >
          {status === 'completed' ? (
            <div className="bg-emerald-500 border border-white text-white p-1 rounded-full shadow-lg">
              <CheckCircle2 size={13} />
            </div>
          ) : (
            <>
              <div className="bg-orange-brand border border-white text-white p-1.5 rounded-full shadow-lg">
                {serviceType === 'jekcargo' ? (
                  <Truck size={11} />
                ) : (
                  <MapPin size={11} />
                )}
              </div>
              <span className="mt-0.5 px-1.5 py-0.5 bg-white text-[7px] text-orange-brand font-bold rounded shadow border border-orange-100 whitespace-nowrap">
                Tujuan
              </span>
            </>
          )}
        </div>
      )}

      {/* 3. Driver Moving Marker */}
      {driverCoords && (status === 'accepted' || status === 'arrived' || status === 'enroute') && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-[400ms] ease-out flex flex-col items-center z-10"
          style={{ left: `${driverCoords.x}%`, top: `${driverCoords.y}%` }}
        >
          <div className="relative">
            <span className="absolute inline-flex h-7 w-7 rounded-full bg-amber-500/40 animate-ping transform -translate-x-1 -translate-y-1"></span>
            <div className="bg-amber-500 border-2 border-white text-slate-900 p-2 rounded-full shadow-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
              <Navigation
                size={14}
                className="transform fill-current text-slate-900"
                style={{
                  // Dynamically turn driver icon in general direction of dropoff or pickup
                  transform: `rotate(${status === 'enroute' ? 45 : -45}deg)`,
                }}
              />
            </div>
          </div>
          <span className="mt-1 px-1.5 py-0.5 bg-amber-500 text-[8px] font-extrabold text-slate-900 rounded-md shadow-md border border-amber-400 whitespace-nowrap uppercase tracking-wider flex items-center gap-1">
            <span>{driverType === 'motor' ? '🏍️ JekRide' : '🚗 JekCar'}</span>
          </span>
        </div>
      )}

      {/* Compass / Speed overlay in corner */}
      {(status === 'accepted' || status === 'arrived' || status === 'enroute') && (
        <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 backdrop-blur px-2.5 py-1.5 rounded-xl text-[9px] text-slate-700 shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-orange-brand flex items-center justify-center text-[7px] text-orange-brand animate-spin">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-400 uppercase tracking-widest">Kecepatan</span>
            <span className="font-mono font-bold text-orange-brand text-xs">
              {status === 'enroute' ? '45' : status === 'arrived' ? '0' : '32'} km/h
            </span>
          </div>
        </div>
      )}

      {/* Street Map Overlay style styles */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
