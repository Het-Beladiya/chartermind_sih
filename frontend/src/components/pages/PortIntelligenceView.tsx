import React from 'react';
import { useCharter } from '../../context/CharterContext';
import { PORT_SPECS, DestinationPort, VESSEL_SPECS, VesselClassId } from '../../types';
import { InteractiveMap } from '../common/InteractiveMap';
import { IconChip } from '../common/IconChip';
import { StatusBadge } from '../common/StatusBadge';
import { formatMoney } from '../../utils/currency';
import {
  Anchor,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Ship,
  Info,
} from 'lucide-react';

export const PortIntelligenceView: React.FC = () => {
  const {
    selectedPort,
    setSelectedPortId,
    selectedVessel,
    setSelectedVesselId,
    topVesselBreakdown,
    currencyUnit,
  } = useCharter();

  const compatibility = topVesselBreakdown.compatibility;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar with Port Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Real-time verification of draught clearances, LOA envelopes, berthing queues, and handling speeds.
          </p>
        </div>

        {/* Selected Port Switcher Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          {Object.values(PORT_SPECS).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPortId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-mono-data cursor-pointer ${
                selectedPort.id === p.id
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'text-[#2B3342] hover:text-[#101828] hover:bg-white'
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Selected Port Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Coastline Map */}
        <div className="lg:col-span-7 flex flex-col space-y-2.5">
          <InteractiveMap
            selectedPort={selectedPort}
            onSelectPort={setSelectedPortId}
          />
          <div className="text-xs text-[#2B3342] flex items-center justify-between px-2 font-mono-data">
            <span>Click any port anchor on the coastline map to inspect terminal metrics</span>
            <span>Bay of Bengal Sector AIS</span>
          </div>
        </div>

        {/* Right 5 cols: Port Specification Detail Card */}
        <div className="lg:col-span-5 rounded-[20px] bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-3.5 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <IconChip icon={<Building2 className="w-5 h-5 text-[#101828]" />} color="teal" size="md" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-[#101828]">
                    {selectedPort.name}
                  </h3>
                  <p className="text-xs text-[#2B3342] font-mono-data">{selectedPort.state}</p>
                </div>
              </div>

              <StatusBadge
                label={`${selectedPort.congestion} Congestion`}
                variant={
                  selectedPort.congestion === 'Low'
                    ? 'success'
                    : selectedPort.congestion === 'Medium'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              />
            </div>

            {/* Port Overview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data mb-1.5">
                <Info className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span>Port Overview & Berthing Profile</span>
              </div>
              <p className="text-xs text-[#101828] leading-relaxed font-sans font-normal">
                {selectedPort.description}
              </p>
            </div>

            {/* Spec Matrix */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Max Permissible Draught</span>
                <span className="font-bold font-mono-data text-[#101828] text-sm">
                  {selectedPort.maxDraft} meters
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Max LOA & Beam Clearance</span>
                <span className="font-bold font-mono-data text-[#101828]">
                  {selectedPort.maxLoa}m LOA · {selectedPort.maxBeam}m Beam
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Average Anchorage Wait</span>
                <span className="font-bold font-mono-data text-[#A36907]">
                  {selectedPort.berthingWaitDays.toFixed(1)} days (~{(selectedPort.berthingWaitDays * 24).toFixed(1)} hrs)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Bulk Discharging Speed</span>
                <span className="font-bold font-mono-data text-[#12883E]">
                  {selectedPort.handlingRateMTPerDay.toLocaleString()} MT / day ({selectedPort.handlingRating})
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Baseline Port Tariff</span>
                <span className="font-bold font-mono-data text-[#101828]">
                  {formatMoney(selectedPort.basePortFeeUSD, currencyUnit)} + handling
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-[#2B3342] font-mono-data">
            <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Updated with live marine pilotage & tide table feeds</span>
          </div>
        </div>
      </div>

      {/* COMPATIBILITY CHECKLIST CARD WITH AUDIT SELECTOR */}
      <div className="rounded-[20px] bg-white p-5 sm:p-7 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <IconChip icon={<Ship className="w-4 h-4 text-[#101828]" />} color="indigo" size="sm" />
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading text-[#101828]">
                Vessel-Port Compatibility Audit: <span className="text-[#0EA5E9]">{selectedVessel.name}</span> at <span className="text-[#101828]">{selectedPort.name}</span>
              </h3>
              <p className="text-xs text-[#2B3342] font-sans">
                Direct verification against physical port safety limits
              </p>
            </div>
          </div>

          {/* Dynamic Vessel Audit Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#2B3342] font-mono-data">Audit Vessel:</label>
            <select
              value={selectedVessel.id}
              onChange={(e) => setSelectedVesselId(e.target.value as VesselClassId)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden cursor-pointer"
            >
              {Object.values(VESSEL_SPECS).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.draft}m draft)
                </option>
              ))}
            </select>
            <StatusBadge
              label={compatibility.isCompatible ? 'Fully Compatible' : 'Incompatible (Violation)'}
              variant={compatibility.isCompatible ? 'success' : 'danger'}
              size="md"
            />
          </div>
        </div>

        {/* 3 Physical Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Draft Fit */}
          <div
            className={`p-4 rounded-xl border ${
              compatibility.draftFit.ok
                ? 'bg-[#12883E]/15 border-[#12883E]/30'
                : 'bg-[#EB1515]/15 border-[#EB1515]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">Draft Clearance</span>
              {compatibility.draftFit.ok ? (
                <span className="w-5 h-5 rounded-md bg-[#12883E] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-md bg-[#EB1515] text-white flex items-center justify-center shadow-xs">
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-data text-[#101828]">
              {selectedVessel.draft}m <span className="text-xs text-[#2B3342]">vessel draft</span>
            </div>
            <div className="text-xs text-[#2B3342] mt-1 font-mono-data">
              Port Limit: <span className="font-bold text-[#101828]">{selectedPort.maxDraft}m</span> ·{' '}
              <span
                className={`font-bold ${
                  compatibility.draftFit.margin >= 0 ? 'text-[#12883E]' : 'text-[#EB1515]'
                }`}
              >
                {compatibility.draftFit.margin >= 0 ? '+' : ''}
                {compatibility.draftFit.margin.toFixed(1)}m buffer
              </span>
            </div>
          </div>

          {/* LOA Fit */}
          <div
            className={`p-4 rounded-xl border ${
              compatibility.loaFit.ok
                ? 'bg-[#12883E]/15 border-[#12883E]/30'
                : 'bg-[#EB1515]/15 border-[#EB1515]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">Length Overall (LOA)</span>
              {compatibility.loaFit.ok ? (
                <span className="w-5 h-5 rounded-md bg-[#12883E] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-md bg-[#EB1515] text-white flex items-center justify-center shadow-xs">
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-data text-[#101828]">
              {selectedVessel.loa}m <span className="text-xs text-[#2B3342]">vessel length</span>
            </div>
            <div className="text-xs text-[#2B3342] mt-1 font-mono-data">
              Port Limit: <span className="font-bold text-[#101828]">{selectedPort.maxLoa}m</span> ·{' '}
              <span className="font-bold text-[#12883E]">
                +{compatibility.loaFit.margin.toFixed(0)}m buffer
              </span>
            </div>
          </div>

          {/* Beam Fit */}
          <div
            className={`p-4 rounded-xl border ${
              compatibility.beamFit.ok
                ? 'bg-[#12883E]/15 border-[#12883E]/30'
                : 'bg-[#EB1515]/15 border-[#EB1515]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">Beam (Breadth)</span>
              {compatibility.beamFit.ok ? (
                <span className="w-5 h-5 rounded-md bg-[#12883E] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-md bg-[#EB1515] text-white flex items-center justify-center shadow-xs">
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-data text-[#101828]">
              {selectedVessel.beam}m <span className="text-xs text-[#2B3342]">vessel beam</span>
            </div>
            <div className="text-xs text-[#2B3342] mt-1 font-mono-data">
              Port Limit: <span className="font-bold text-[#101828]">{selectedPort.maxBeam}m</span> ·{' '}
              <span className="font-bold text-[#12883E]">
                +{compatibility.beamFit.margin.toFixed(1)}m buffer
              </span>
            </div>
          </div>
        </div>

        {/* Warnings list if any */}
        {compatibility.warnings.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#A36907]/15 border border-[#A36907]/30 text-xs text-[#A36907] space-y-1">
            <div className="font-bold flex items-center gap-1.5 font-mono-data">
              <AlertTriangle className="w-4 h-4 text-[#A36907]" />
              <span>Operational Advisories:</span>
            </div>
            {compatibility.warnings.map((w, i) => (
              <div key={i} className="pl-5 font-sans">
                • {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
