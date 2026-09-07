import React, { useState } from 'react';
import { PORT_SPECS, DestinationPort, PortSpec } from '../../types';

interface InteractiveMapProps {
  selectedPort: PortSpec;
  onSelectPort: (portId: DestinationPort) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  selectedPort,
  onSelectPort,
}) => {
  const [hoveredPort, setHoveredPort] = useState<DestinationPort | null>(null);

  // Scaled coordinates for SVG layout (Indian East Coast / Bay of Bengal region)
  // [x, y] in viewBox 0 0 600 450
  const portPositions: Record<DestinationPort, { x: number; y: number }> = {
    Kolkata: { x: 390, y: 105 },
    Haldia: { x: 375, y: 135 },
    Dhamra: { x: 350, y: 195 },
    Paradip: { x: 335, y: 240 },
    Vizag: { x: 260, y: 345 },
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[430px] rounded-[20px] bg-white p-4 overflow-hidden border border-slate-200/80 shadow-sm">
      <svg
        viewBox="0 0 600 450"
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="routeLineGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0B5D63" />
          </linearGradient>
        </defs>

        {/* Ocean Background Bathymetry Shading */}
        <rect width="600" height="450" fill="#F1F5F9" />
        <path
          d="M 200 450 Q 320 380 390 260 Q 440 180 480 120 L 600 120 L 600 450 Z"
          fill="#E2E8F0"
          opacity="0.4"
        />
        <path
          d="M 320 450 Q 420 380 470 280 Q 520 200 550 140 L 600 140 L 600 450 Z"
          fill="#CBD5E1"
          opacity="0.3"
        />

        {/* Landmass representation (Eastern India coastline) */}
        <path
          d="M 0 0 L 450 0 Q 420 70 395 105 Q 380 130 365 160 Q 345 210 330 250 Q 280 320 240 370 Q 180 430 120 450 L 0 450 Z"
          fill="url(#landGradient)"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />

        {/* Navigational Coordinate Grid */}
        <g stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.6">
          <line x1="0" y1="100" x2="600" y2="100" />
          <line x1="0" y1="200" x2="600" y2="200" />
          <line x1="0" y1="300" x2="600" y2="300" />
          <line x1="0" y1="400" x2="600" y2="400" />
          <line x1="150" y1="0" x2="150" y2="450" />
          <line x1="300" y1="0" x2="300" y2="450" />
          <line x1="450" y1="0" x2="450" y2="450" />
        </g>

        {/* Sea Title */}
        <text
          x="440"
          y="340"
          fill="#64748B"
          opacity="0.5"
          fontSize="14"
          fontWeight="700"
          fontFamily="Outfit, sans-serif"
          letterSpacing="4"
        >
          BAY OF BENGAL
        </text>

        {/* Shipping Sea Lanes */}
        <path
          d="M 580 420 Q 450 360 335 240"
          fill="none"
          stroke="url(#routeLineGradient)"
          strokeWidth="2.2"
          strokeDasharray="5 5"
        />
        <path
          d="M 580 440 Q 420 390 260 345"
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <path
          d="M 580 410 Q 460 310 350 195"
          fill="none"
          stroke="#0B5D63"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Labeled AIS Live Vessel Marker */}
        {selectedPort && portPositions[selectedPort.id] && (
          <g
            transform={`translate(${portPositions[selectedPort.id].x + 55}, ${portPositions[selectedPort.id].y + 35})`}
            className="transition-all duration-700 select-none"
          >
            <circle r="12" fill="#0EA5E9" fillOpacity="0.25" className="animate-ping" />
            <circle r="7" fill="#101828" stroke="#0EA5E9" strokeWidth="2" />
            <rect x="12" y="-12" width="160" height="22" rx="6" fill="#101828" stroke="#334155" strokeWidth="1" />
            <text x="20" y="3" fontSize="9.5" fontWeight="bold" fill="#0EA5E9" fontFamily="JetBrains Mono, monospace">
              AIS: MV Bengal Star (In-Transit)
            </text>
          </g>
        )}

        {/* Ports Markers */}
        {Object.values(PORT_SPECS).map((port) => {
          const pos = portPositions[port.id];
          const isSelected = selectedPort.id === port.id;
          const isHovered = hoveredPort === port.id;

          const congestionColor =
            port.congestion === 'Low'
              ? '#16A34A'
              : port.congestion === 'Medium'
              ? '#F59E0B'
              : '#EF4444';

          const labelText = `${port.id} (${port.maxDraft}m draft)`;
          const pillWidth = isSelected ? Math.max(130, labelText.length * 7.2 + 20) : Math.max(115, labelText.length * 6.6 + 16);
          const pillX = Math.max(10, Math.min(590 - pillWidth, pos.x - pillWidth / 2));
          const textX = pillX + pillWidth / 2;

          return (
            <g
              key={port.id}
              className="cursor-pointer transition-transform duration-200"
              onClick={() => onSelectPort(port.id)}
              onMouseEnter={() => setHoveredPort(port.id)}
              onMouseLeave={() => setHoveredPort(null)}
            >
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="20"
                  fill="#0EA5E9"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
              )}

              {/* Pin Base Ring */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? '12' : '8.5'}
                fill={isSelected ? '#101828' : '#FFFFFF'}
                stroke={isSelected ? '#0EA5E9' : '#64748B'}
                strokeWidth={isSelected ? '2.5' : '1.5'}
              />

              {/* Congestion Status Indicator */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 4.5 : 3}
                fill={congestionColor}
              />

              {/* Port Name Label Pill */}
              <g>
                <rect
                  x={pillX}
                  y={pos.y - 30}
                  width={pillWidth}
                  height="22"
                  rx="6"
                  fill={isSelected ? '#101828' : '#FFFFFF'}
                  stroke={isSelected ? '#0EA5E9' : '#CBD5E1'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                  filter="drop-shadow(0 2px 4px rgba(15,23,42,0.08))"
                />
                <text
                  x={textX}
                  y={pos.y - 15}
                  textAnchor="middle"
                  fontSize={isSelected ? '10.5' : '9.5'}
                  fontWeight={isSelected ? '700' : '600'}
                  fill={isSelected ? '#FFFFFF' : '#101828'}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {labelText}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating Legend in Solid White Card */}
      <div className="absolute bottom-3 left-3 bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-[#101828] font-heading">Port Congestion:</span>
        <span className="flex items-center gap-1.5 text-[#101828] font-mono-data text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Low
        </span>
        <span className="flex items-center gap-1.5 text-[#101828] font-mono-data text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Medium
        </span>
        <span className="flex items-center gap-1.5 text-[#101828] font-mono-data text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> High / Critical
        </span>
      </div>

      <div className="absolute top-3 right-3 bg-white rounded-xl px-3 py-1.5 shadow-xs border border-slate-200/80 text-xs font-semibold text-[#101828] font-mono-data">
        Selected: <span className="text-[#0B5D63] font-bold">{selectedPort.name}</span>
      </div>
    </div>
  );
};
