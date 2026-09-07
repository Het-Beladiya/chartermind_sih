import React from 'react';
import { useCharter } from '../../context/CharterContext';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { IconChip } from '../common/IconChip';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const RiskEngineView: React.FC = () => {
  const { riskScores, selectedPort, selectedVessel } = useCharter();

  // Custom Polar Angle Tick with solid chip backing for chart legibility
  const CustomPolarAngleTick = ({ payload, x, y, textAnchor }: any) => {
    const text = payload.value;
    const approxWidth = text.length * 6.8 + 14;
    let rectX = -approxWidth / 2;
    if (textAnchor === 'start') rectX = -2;
    if (textAnchor === 'end') rectX = -approxWidth + 2;

    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={rectX}
          y={-11}
          width={approxWidth}
          height={20}
          rx={5}
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth={1}
        />
        <text
          textAnchor={textAnchor}
          x={0}
          y={4}
          fill="#101828"
          fontSize={11}
          fontWeight={700}
          fontFamily="Outfit, sans-serif"
        >
          {text}
        </text>
      </g>
    );
  };

  // Radar data format with clear labels & precomputed zone thresholds for background bands
  const congestionRisk = riskScores.congestionRisk ?? riskScores.portRisk ?? 30;
  const volatilityRisk = riskScores.volatilityRisk ?? riskScores.marketRisk ?? 40;
  const draftRisk = riskScores.draftRisk ?? riskScores.vesselRisk ?? 25;
  const weatherRisk = riskScores.weatherRisk ?? 20;
  const commodityRisk = riskScores.commodityRisk ?? 25;

  const radarData = [
    { subject: 'Weather / Sea State', score: weatherRisk, fullMark: 100, dangerZone: 100, cautionZone: 65, safeZone: 40 },
    { subject: 'Port Congestion', score: congestionRisk, fullMark: 100, dangerZone: 100, cautionZone: 65, safeZone: 40 },
    { subject: 'Baltic Volatility', score: volatilityRisk, fullMark: 100, dangerZone: 100, cautionZone: 65, safeZone: 40 },
    { subject: 'Draft & LOA Fit', score: draftRisk, fullMark: 100, dangerZone: 100, cautionZone: 65, safeZone: 40 },
    { subject: 'Commodity Handling', score: commodityRisk, fullMark: 100, dangerZone: 100, cautionZone: 65, safeZone: 40 },
  ];

  const riskCategories = [
    {
      name: 'Weather & Metocean Sea State',
      score: weatherRisk,
      desc: 'Monsoon swells, tropical depressions, and seasonal squall factors along the transit corridor.',
      color: weatherRisk > 60 ? 'bg-[#EB1515]' : weatherRisk > 35 ? 'bg-[#A36907]' : 'bg-[#12883E]',
    },
    {
      name: 'Port Queue & Berthing Congestion',
      score: congestionRisk,
      desc: `Anchorage queue depth, pilotage turnarounds, and berth availability at ${selectedPort.name}.`,
      color: congestionRisk > 60 ? 'bg-[#EB1515]' : congestionRisk > 35 ? 'bg-[#A36907]' : 'bg-[#12883E]',
    },
    {
      name: 'Freight Market Volatility (Baltic)',
      score: volatilityRisk,
      desc: 'Macroeconomic spot volatility, regional tonnage tightening, and bunker fuel fluctuations.',
      color: volatilityRisk > 60 ? 'bg-[#EB1515]' : volatilityRisk > 35 ? 'bg-[#A36907]' : 'bg-[#12883E]',
    },
    {
      name: 'Draught & Navigational Clearance',
      score: draftRisk,
      desc: `Draught safety margins for ${selectedVessel.name} against ${selectedPort.name} tidal channel limits.`,
      color: draftRisk > 60 ? 'bg-[#EB1515]' : draftRisk > 35 ? 'bg-[#A36907]' : 'bg-[#12883E]',
    },
    {
      name: 'Commodity Handling & Moisture Limits',
      score: commodityRisk,
      desc: 'Transportable moisture limit (TML), liquefaction risk, and grab unloader discharging rates.',
      color: commodityRisk > 60 ? 'bg-[#EB1515]' : commodityRisk > 35 ? 'bg-[#A36907]' : 'bg-[#12883E]',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Continuous multi-dimensional hazard assessment synthesizing AIS queues, Baltic volatility, and weather models.
          </p>
        </div>

        {/* Aggregate Composite Score Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
          <span className="text-xs text-[#2B3342] font-mono-data">Composite Risk:</span>
          <span className="text-base font-bold font-mono-data text-[#101828]">
            {riskScores.overallScore} / 100
          </span>
          <StatusBadge
            label={riskScores.bucket}
            variant={
              riskScores.bucket === 'Low'
                ? 'success'
                : riskScores.bucket === 'Medium'
                ? 'warning'
                : 'danger'
            }
            size="sm"
          />
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* RADAR CHART (Left 6 cols) */}
        <div className="lg:col-span-6 rounded-[20px] bg-white p-5 sm:p-7 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <div className="flex items-center gap-2">
                <IconChip icon={<ShieldAlert className="w-4 h-4 text-[#101828]" />} color="rose" size="sm" />
                <h3 className="text-base font-bold font-heading text-[#101828]">
                  5-Factor Risk Pentagram
                </h3>
              </div>
              <span className="text-xs font-mono-data text-[#2B3342]">Max Threshold: 100</span>
            </div>

            <div className="h-[360px] sm:h-[420px] w-full flex items-center justify-center relative">
              <div className="absolute inset-2 rounded-2xl bg-slate-50 border border-slate-200/60 shadow-xs" />
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <RadarChart data={radarData} outerRadius="65%" margin={{ top: 28, right: 40, bottom: 28, left: 40 }}>
                  <defs>
                    <linearGradient id="riskRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#0B5D63" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="riskRadarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#0B5D63" />
                    </linearGradient>
                  </defs>

                  {/* Color-coded risk zone bands, drawn back-to-front so inner (safe) sits on top of grid but under the data polygon */}
                  <PolarGrid stroke="#CBD5E1" strokeDasharray="3 3" opacity={0.5} />
                  <Radar dataKey="dangerZone" stroke="none" fill="#EB1515" fillOpacity={0.06} isAnimationActive={false} />
                  <Radar dataKey="cautionZone" stroke="none" fill="#A36907" fillOpacity={0.07} isAnimationActive={false} />
                  <Radar dataKey="safeZone" stroke="none" fill="#12883E" fillOpacity={0.08} isAnimationActive={false} />

                  <PolarAngleAxis
                    dataKey="subject"
                    tick={<CustomPolarAngleTick />}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="score"
                    stroke="url(#riskRadarStroke)"
                    strokeWidth={3}
                    fill="url(#riskRadarFill)"
                    fillOpacity={1}
                    dot={{ r: 4, fill: '#0EA5E9', stroke: '#FFFFFF', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(14,165,233,0.25))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#101828] text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-mono-data">
                            <div className="font-bold text-[#0EA5E9]">{data.subject}</div>
                            <div className="text-white font-bold mt-0.5">Risk Score: {data.score} / 100</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#2B3342] pt-3 border-t border-slate-200/80 font-mono-data">
            <span className="text-[11px]">Lower perimeter represents lower operational risk</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 font-semibold text-[#12883E]">
                <span className="w-2 h-2 rounded-full bg-[#12883E]" /> Safe (&le;40)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#A36907]">
                <span className="w-2 h-2 rounded-full bg-[#A36907]" /> Caution (41–65)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#EB1515]">
                <span className="w-2 h-2 rounded-full bg-[#EB1515]" /> High (&gt;65)
              </span>
            </div>
          </div>
        </div>

        {/* 5 HORIZONTAL STATUS BARS (Right 6 cols) */}
        <div className="lg:col-span-6 rounded-[20px] bg-white p-5 sm:p-7 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3.5">
              <h3 className="text-base font-bold font-heading text-[#101828]">
                Risk Sub-Score Decomposition
              </h3>
              <span className="text-xs text-[#2B3342] font-mono-data">Target &lt; 40</span>
            </div>

            <div className="space-y-2.5">
              {riskCategories.map((cat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-bold text-[#101828] font-heading">{cat.name}</span>
                    <span className="text-xs font-bold font-mono-data text-[#101828]">
                      {cat.score} <span className="text-[11px] font-normal text-[#2B3342]">/ 100</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-[#2B3342] mb-2 font-sans leading-tight">{cat.desc}</p>

                  {/* Horizontal bar */}
                  <div className="h-2 rounded-full bg-[#E3E9F5] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cat.color}`}
                      style={{ width: `${Math.min(100, Math.max(5, cat.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-[#2B3342] flex items-center gap-2 font-sans">
            <Sparkles className="w-4 h-4 text-[#0EA5E9] shrink-0" />
            <span>Risk weights are dynamically adjusted in the What-If Simulator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
