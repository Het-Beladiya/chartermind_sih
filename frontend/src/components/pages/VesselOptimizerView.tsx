import React, { useState } from 'react';
import { useCharter } from '../../context/CharterContext';
import { VesselClassId } from '../../types';
import { IconChip } from '../common/IconChip';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatFreightRate,
  formatMoney,
} from '../../utils/currency';
import {
  Ship,
  Anchor,
  Ruler,
  Fuel,
  Gauge,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const VesselOptimizerView: React.FC = () => {
  const {
    vesselRecommendations,
    selectedVessel,
    setSelectedVesselId,
    cargoRequest,
    selectedPort,
    currencyUnit,
  } = useCharter();

  const [expandedVesselId, setExpandedVesselId] = useState<VesselClassId | null>(
    vesselRecommendations[0]?.vessel.id || null
  );

  const toggleExpand = (id: VesselClassId) => {
    setExpandedVesselId(expandedVesselId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Concise Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Evaluating deadweight suitability, draft compatibility at {selectedPort.name} ({selectedPort.maxDraft}m limit), fuel economy, and fleet availability.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#101828] shrink-0 font-mono-data">
          <span className="text-[#2B3342]">Parcel:</span>
          <span className="font-bold text-[#101828]">
            {cargoRequest.cargoQuantity.toLocaleString()} MT {cargoRequest.cargoType}
          </span>
        </div>
      </div>

      {/* 4 Vessel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {vesselRecommendations.map((rec) => {
          const { vessel, finalScore, isBestChoice, compatibility, reasons, estimatedFreightPerMT } = rec;
          const isSelected = selectedVessel.id === vessel.id;
          const isExpanded = expandedVesselId === vessel.id;

          return (
            <div
              key={vessel.id}
              className={`relative rounded-[20px] bg-white p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-sm ${
                isBestChoice
                  ? 'border-2 border-[#0EA5E9] shadow-md ring-2 ring-[#0EA5E9]/20'
                  : isSelected
                  ? 'border-2 border-[#101828] shadow-sm'
                  : 'border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  {isBestChoice ? (
                    <StatusBadge
                      label="AI Best Choice"
                      variant="success"
                      size="sm"
                      icon={<Award className="w-3.5 h-3.5" />}
                      pulse
                    />
                  ) : !compatibility.isCompatible ? (
                    <StatusBadge
                      label="Draft Exceeded"
                      variant="danger"
                      size="sm"
                      icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#2B3342] uppercase tracking-wider font-mono-data">
                      Ranked Option
                    </span>
                  )}

                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold font-mono-data bg-slate-100 text-[#101828] border border-slate-200/80">
                    {vessel.availability}
                  </span>
                </div>

                {/* Vessel Name & Category */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-[#101828] tracking-tight">
                    {vessel.name}
                  </h3>
                  <p className="text-xs text-[#2B3342] font-sans">{vessel.categoryName}</p>
                </div>

                {/* Score & Freight Box */}
                <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E3E9F5]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          finalScore >= 80
                            ? 'text-[#12883E]'
                            : finalScore >= 50
                            ? 'text-[#A36907]'
                            : 'text-[#EB1515]'
                        }
                        strokeDasharray={`${Math.min(100, Math.max(0, finalScore))}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-bold font-mono-data text-[#101828] block leading-none">
                        {finalScore}
                      </span>
                      <span className="text-[7px] uppercase font-bold text-[#2B3342] leading-none font-mono-data">
                        Score
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-[#2B3342] uppercase tracking-wider font-mono-data">Est. Freight</div>
                    <div className="text-base sm:text-lg font-bold font-mono-data text-[#101828]">
                      {formatFreightRate(estimatedFreightPerMT, currencyUnit)}
                    </div>
                    <div className="text-[10px] text-[#12883E] font-bold font-mono-data">
                      {formatMoney(estimatedFreightPerMT * cargoRequest.cargoQuantity, currencyUnit)}
                    </div>
                  </div>
                </div>

                {/* Draft Alert / Status Card */}
                <div
                  className={`p-2.5 rounded-lg border mb-3 text-xs flex items-center justify-between gap-1.5 ${
                    compatibility.draftFit.ok
                      ? 'bg-slate-50 border-slate-200/80 text-[#101828]'
                      : 'bg-[#EB1515]/10 border-[#EB1515]/30 text-[#EB1515]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Anchor className={`w-3.5 h-3.5 shrink-0 ${compatibility.draftFit.ok ? 'text-[#2B3342]' : 'text-[#EB1515]'}`} strokeWidth={2.25} />
                    <span className="font-semibold text-xs whitespace-nowrap">
                      Draft: <span className="font-mono-data font-bold">{vessel.draft}m</span>
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono-data whitespace-nowrap shrink-0 px-2 py-0.5 rounded font-bold ${
                      compatibility.draftFit.ok
                        ? 'text-[#101828] bg-white border border-slate-200/80'
                        : 'text-[#EB1515] bg-[#EB1515]/15 border border-[#EB1515]/30'
                    }`}
                  >
                    {compatibility.draftFit.ok ? `Max ${selectedPort.maxDraft}m` : 'Exceeds Limit'}
                  </span>
                </div>

                {/* Compact 2x2 Specs Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono-data">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 h-[52px] flex flex-col justify-between">
                    <span className="text-[10px] text-[#2B3342] block leading-none font-sans font-medium">LOA × Beam</span>
                    <span className="text-[11px] font-bold text-[#101828] whitespace-nowrap tracking-tight block">
                      {vessel.loa}m × {vessel.beam}m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 h-[52px] flex flex-col justify-between">
                    <span className="text-[10px] text-[#2B3342] block leading-none font-sans font-medium">DWT Range</span>
                    <span className="text-[11px] font-bold text-[#101828] whitespace-nowrap block">
                      {(vessel.dwtMax / 1000).toFixed(0)}k DWT
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 h-[52px] flex flex-col justify-between">
                    <span className="text-[10px] text-[#2B3342] block leading-none font-sans font-medium">Fuel Burn</span>
                    <span className="text-[11px] font-bold text-[#101828] whitespace-nowrap block">
                      {vessel.fuelConsumption} MT/d
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 h-[52px] flex flex-col justify-between">
                    <span className="text-[10px] text-[#2B3342] block leading-none font-sans font-medium">Service Speed</span>
                    <span className="text-[11px] font-bold text-[#101828] whitespace-nowrap block">
                      {vessel.speed} kts
                    </span>
                  </div>
                </div>

                {/* Collapsible AI Rationale */}
                <button
                  type="button"
                  onClick={() => toggleExpand(vessel.id)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#101828] border border-slate-200/80 text-xs font-semibold flex items-center justify-between transition-colors mb-3 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-heading text-[11px]">
                    <Sparkles className="w-3 h-3 text-[#0EA5E9]" />
                    <span>Why Did AI Score This?</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} /> : <ChevronDown className="w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} />}
                </button>

                {isExpanded && (
                  <div className="space-y-1.5 mb-4 text-[11px] text-[#101828] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-xs font-sans">
                    {reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12883E] shrink-0 mt-0.5" />
                        <span className="font-medium text-[#101828]">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anchored Action Button */}
              <div className="pt-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSelectedVesselId(vessel.id)}
                  disabled={!compatibility.isCompatible}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all font-heading cursor-pointer ${
                    isSelected
                      ? 'bg-[#101828] text-white shadow-xs'
                      : compatibility.isCompatible
                      ? 'bg-slate-50 text-[#101828] border border-slate-200/80 hover:bg-slate-100'
                      : 'bg-slate-100 text-[#94A3B8] border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isSelected ? 'Active Selection' : compatibility.isCompatible ? 'Select Vessel' : 'Incompatible with Port'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
