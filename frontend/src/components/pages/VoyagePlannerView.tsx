import React, { useState } from 'react';
import { useCharter } from '../../context/CharterContext';
import {
  CargoType,
  OriginCountry,
  DestinationPort,
  PriorityOption,
  ContractDuration,
  PORT_SPECS,
} from '../../types';
import { IconChip } from '../common/IconChip';
import {
  Package,
  Globe,
  Calendar,
  Target,
  Ship,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  TrendingDown,
  Scale,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VoyagePlannerView: React.FC = () => {
  const { cargoRequest, generateRecommendation, isGenerating } = useCharter();
  const [form, setForm] = useState(cargoRequest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0EA5E9', '#0B5D63', '#12883E', '#7C6CF0'],
    });
    generateRecommendation(form);
  };

  const priorityOptions: { id: PriorityOption; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'Balanced', label: 'Balanced', icon: <Scale className="w-4 h-4" strokeWidth={2.25} />, desc: 'Optimal trade-off of freight cost, voyage turnaround speed, and safety margin.' },
    { id: 'Lowest cost', label: 'Lowest Cost', icon: <TrendingDown className="w-4 h-4" strokeWidth={2.25} />, desc: 'Minimize $/MT freight baseline and aggregate voyage expenditure.' },
    { id: 'Fastest delivery', label: 'Fastest Delivery', icon: <Zap className="w-4 h-4" strokeWidth={2.25} />, desc: 'Prioritize prompt laycans and rapid terminal turnaround.' },
    { id: 'Lowest risk', label: 'Lowest Risk', icon: <Shield className="w-4 h-4" strokeWidth={2.25} />, desc: 'Maximize draught clearance buffers and vetted fleet reliability.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Concise intro banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
          Specify cargo parcel, route basin, and laycan constraints to dynamically recalibrate fixture scoring and cost ledgers.
        </p>
      </div>

      {/* Main Form Card in Solid White */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 divide-y divide-slate-200/80"
      >
        {/* SECTION 1: CARGO SPECIFICATIONS */}
        <div className="pb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <IconChip icon={<Package className="w-4 h-4" />} color="indigo" size="sm" />
            <h3 className="text-sm sm:text-base font-bold font-heading text-[#101828]">
              1. Cargo & Commodity Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-1.5 font-mono-data">
                Cargo Type
              </label>
              <select
                value={form.cargoType}
                onChange={(e) => setForm({ ...form, cargoType: e.target.value as CargoType })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all shadow-xs"
              >
                <option value="Coal">Coal (Thermal / Coking)</option>
                <option value="Iron Ore">Iron Ore (Fines / Pellets)</option>
                <option value="Bauxite">Bauxite (Alumina Ore)</option>
                <option value="Grain">Grain (Wheat / Soybeans)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-1.5 font-mono-data">
                Cargo Quantity (Metric Tons)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.cargoQuantity ? form.cargoQuantity.toLocaleString() : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    const num = Number(raw) || 0;
                    setForm({ ...form, cargoQuantity: num });
                  }}
                  placeholder="75,000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-bold font-mono-data focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all shadow-xs"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#2B3342] font-mono-data">
                  MT
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[50000, 75000, 120000, 150000].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setForm({ ...form, cargoQuantity: qty })}
                    aria-label={`Set cargo quantity to ${qty.toLocaleString()} metric tons`}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-mono-data font-semibold border transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] ${
                      form.cargoQuantity === qty
                        ? 'bg-[#101828] text-white border-[#101828] shadow-xs'
                        : 'bg-slate-50 text-[#101828] border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {qty.toLocaleString()} MT
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ROUTE & PORTS */}
        <div className="py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <IconChip icon={<Globe className="w-4 h-4" />} color="blue" size="sm" />
            <h3 className="text-sm sm:text-base font-bold font-heading text-[#101828]">
              2. Origin Basin & Discharge Port
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                  Origin Country / Basin
                </label>
                <span title="Loading terminal basin and benchmark route" className="text-[#94A3B8] hover:text-[#2B3342] cursor-help">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value as OriginCountry })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all shadow-xs"
              >
                <option value="Australia">Australia (Hay Point / Newcastle)</option>
                <option value="Indonesia">Indonesia (Taboneo / Samarinda)</option>
                <option value="South Africa">South Africa (Richards Bay)</option>
                <option value="Mozambique">Mozambique (Maputo / Beira)</option>
                <option value="Russia">Russia (Ust-Luga / Vostochny)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                  Discharge Destination Port
                </label>
                <span title="East Coast India commercial discharge port" className="text-[#94A3B8] hover:text-[#2B3342] cursor-help">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                value={form.destinationPort}
                onChange={(e) => setForm({ ...form, destinationPort: e.target.value as DestinationPort })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all shadow-xs"
              >
                {Object.values(PORT_SPECS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Max Draft: {p.maxDraft}m · {p.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: TIMING & LAYCAN WINDOWS */}
        <div className="py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <IconChip icon={<Calendar className="w-4 h-4" />} color="amber" size="sm" />
            <h3 className="text-sm sm:text-base font-bold font-heading text-[#101828]">
              3. Delivery Schedule & Laycan Windows
            </h3>
          </div>

          <div className="space-y-4">
            {/* Required Delivery Date */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                      Required Delivery Date
                    </label>
                    <span title="Target terminal arrival deadline for plant consumption schedule" className="text-[#94A3B8] cursor-help">
                      <Info className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[11px] text-[#2B3342] font-sans mt-0.5">
                    Target terminal arrival deadline for plant consumption schedule
                  </p>
                </div>
                <input
                  type="date"
                  value={form.requiredDeliveryDate}
                  onChange={(e) => setForm({ ...form, requiredDeliveryDate: e.target.value })}
                  className="w-full sm:w-60 px-3.5 py-2 rounded-lg bg-white border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden shadow-xs"
                />
              </div>
            </div>

            {/* Windows side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                    Loading Laycan Window
                  </label>
                  <span title="Designated loading window laycan at origin terminal" className="text-[#94A3B8] cursor-help">
                    <Info className="w-3 h-3" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="block text-[10px] text-[#2B3342] font-mono-data mb-1">From</span>
                    <input
                      type="date"
                      value={form.loadingWindowStart}
                      onChange={(e) => setForm({ ...form, loadingWindowStart: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#2B3342] font-mono-data mb-1">To</span>
                    <input
                      type="date"
                      value={form.loadingWindowEnd}
                      onChange={(e) => setForm({ ...form, loadingWindowEnd: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                    Discharge Laycan Window
                  </label>
                  <span title="Anticipated berthing and discharge window at destination port" className="text-[#94A3B8] cursor-help">
                    <Info className="w-3 h-3" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="block text-[10px] text-[#2B3342] font-mono-data mb-1">From</span>
                    <input
                      type="date"
                      value={form.dischargeWindowStart}
                      onChange={(e) => setForm({ ...form, dischargeWindowStart: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#2B3342] font-mono-data mb-1">To</span>
                    <input
                      type="date"
                      value={form.dischargeWindowEnd}
                      onChange={(e) => setForm({ ...form, dischargeWindowEnd: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[#101828] text-xs font-bold font-mono-data focus:border-[#0EA5E9] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: VESSEL PREFERENCE & COMMERCIAL TARGETS */}
        <div className="py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <IconChip icon={<Ship className="w-4 h-4" />} color="teal" size="sm" />
            <h3 className="text-sm sm:text-base font-bold font-heading text-[#101828]">
              4. Vessel Selection & Commercial Limits
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#101828] uppercase tracking-wider font-mono-data">
                  Preferred Vessel Type
                </label>
                <span title="Choose vessel class or allow AI to rank across multi-criteria metrics" className="text-[#94A3B8] cursor-help">
                  <Info className="w-3.5 h-3.5" />
                </span>
              </div>
              <select
                value={form.preferredVesselType}
                onChange={(e) => setForm({ ...form, preferredVesselType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 outline-hidden shadow-xs"
              >
                <option value="Let AI decide">✨ Let AI Decide (Recommended: Multi-Criteria Scored)</option>
                <option value="capesize">Capesize (120,000 – 210,000 DWT)</option>
                <option value="panamax">Panamax / Kamsarmax (65,000 – 85,000 DWT)</option>
                <option value="supramax">Supramax / Ultramax (50,000 – 65,000 DWT)</option>
                <option value="handysize">Handysize (25,000 – 40,000 DWT)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-1.5 font-mono-data">
                  Max Acceptable Freight ($/MT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={60}
                    step={0.5}
                    value={form.maxAcceptableFreight}
                    onChange={(e) => setForm({ ...form, maxAcceptableFreight: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-bold font-mono-data focus:bg-white focus:border-sky-500 outline-hidden shadow-xs"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#2B3342] font-mono-data">
                    $/MT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-1.5 font-mono-data">
                  Contract Duration & Structure
                </label>
                <select
                  value={form.contractDuration}
                  onChange={(e) => setForm({ ...form, contractDuration: e.target.value as ContractDuration })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#101828] text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 outline-hidden shadow-xs"
                >
                  <option value="Single voyage">Single Spot Voyage (1x)</option>
                  <option value="3 months">3 Months Multi-Voyage (COA)</option>
                  <option value="6 months">6 Months Semi-Annual (COA)</option>
                  <option value="12 months">12 Months Annual Hedge (COA)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: AI OPTIMIZATION PRIORITY */}
        <div className="py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <IconChip icon={<Target className="w-4 h-4" />} color="rose" size="sm" />
            <h3 className="text-sm sm:text-base font-bold font-heading text-[#101828]">
              5. AI Optimization Objective & Priority
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
            {priorityOptions.map((opt) => {
              const isSelected = form.priority === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setForm({ ...form, priority: opt.id })}
                  aria-pressed={isSelected}
                  aria-label={`Select ${opt.label} priority strategy: ${opt.desc}`}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'bg-[#101828] text-white border-[#101828] shadow-md ring-2 ring-[#0EA5E9]/20'
                      : 'bg-slate-50 text-[#101828] border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={isSelected ? 'text-[#0EA5E9]' : 'text-[#2B3342]'}>{opt.icon}</span>
                      <span className="font-bold text-xs font-heading">{opt.label}</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed font-sans ${isSelected ? 'text-white/80' : 'text-[#2B3342]'}`}>
                      {opt.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-[10px] font-mono-data text-[#0EA5E9] font-bold">
                      ● Active Strategy
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DISTINCT PRIMARY CTA BUTTON */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isGenerating}
            aria-label="Generate AI Recommendation"
            className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-[#101828] hover:bg-[#0B5D63] border border-[#101828] shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer font-heading group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2"
          >
            {isGenerating ? (
              <>
                <span className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></span>
                <span className="font-sans text-sm">Synthesizing Multi-Modal Maritime Recommendation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#0EA5E9] group-hover:text-white transition-colors" />
                <span>Generate AI Recommendation</span>
                <ArrowRight className="w-4 h-4 text-[#0EA5E9] group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
