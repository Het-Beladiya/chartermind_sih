import React from 'react';
import { useCharter } from '../../context/CharterContext';
import { IconChip } from '../common/IconChip';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatFreightRate,
  formatMoney,
  formatSavings,
} from '../../utils/currency';
import {
  FileCheck,
  Award,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const ContractAdvisorView: React.FC = () => {
  const {
    contractComparison,
    cargoRequest,
    selectedVessel,
    currencyUnit,
  } = useCharter();

  const totalVolume = cargoRequest.cargoQuantity * cargoRequest.numberOfVoyages;
  const isMultiRecommended = contractComparison.recommendedStrategy === 'Multiple-Voyage';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <IconChip icon={<FileCheck className="w-4 h-4 text-[#0B5D63]" />} color="violet" size="sm" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#101828] tracking-tight">
              Contract Strategy Advisor: Spot vs. Multi-Voyage COA
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#2B3342] mt-1 font-sans">
            Hedging analysis evaluating volume freight discounts, fleet reservation commitments, and volatility insulation
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono-data text-[#101828]">
          <span className="text-[#2B3342]">Evaluated Volume:</span>
          <span className="font-bold text-[#101828]">
            {totalVolume.toLocaleString()} MT ({cargoRequest.numberOfVoyages}x Voyages)
          </span>
        </div>
      </div>

      {/* 2 SIDE-BY-SIDE ASYMMETRIC COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: MULTI-VOYAGE (COA) */}
        <div
          className={`relative rounded-[20px] bg-white p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between shadow-sm ${
            isMultiRecommended
              ? 'border-2 border-[#0EA5E9] shadow-md ring-2 ring-[#0EA5E9]/20'
              : 'border border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B3342] font-mono-data">
                  Structure A
                </span>
                {isMultiRecommended && (
                  <StatusBadge
                    label="AI Recommended Strategy"
                    variant="success"
                    size="sm"
                    icon={<Award className="w-3.5 h-3.5" />}
                    pulse
                  />
                )}
              </div>
              <span className="text-xs font-bold font-mono-data px-2.5 py-1 rounded-md bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30">
                {contractComparison.savingsPercent}% Rate Hedge
              </span>
            </div>

            <h3 className="text-xl font-bold font-heading text-[#101828] mb-1">
              Multiple-Voyage Contract (COA)
            </h3>
            <p className="text-xs text-[#2B3342] mb-6 font-sans">
              Consecutive {cargoRequest.numberOfVoyages}x voyage fixture commitment over {cargoRequest.contractDuration}
            </p>

            {/* Metrics */}
            <div className="p-4 rounded-xl bg-[#12883E]/15 border border-[#12883E]/30 mb-5">
              <div className="text-xs font-semibold text-[#12883E] font-mono-data">Discounted Freight Baseline</div>
              <div className="text-3xl font-bold font-mono-data text-[#101828] mt-1">
                {formatFreightRate(contractComparison.multiVoyageFreightRatePerMT, currencyUnit)}
              </div>
              <div className="text-xs font-bold font-mono-data text-[#12883E] mt-1">
                Total Commitment: {formatMoney(contractComparison.multiVoyageTotalCostUSD, currencyUnit)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Rate Volatility Hedge</span>
                <span className="font-bold font-mono-data text-[#12883E]">
                  Fixed ceiling protection
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Vessel Tonnage Guarantee</span>
                <span className="font-bold font-mono-data text-[#12883E]">
                  Dedicated fleet laycan
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Operational Flexibility</span>
                <span className="font-bold font-mono-data text-[#101828]">
                  Pre-scheduled laycan windows
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Risk Exposure Index</span>
                <span className="font-bold font-mono-data text-[#12883E]">
                  {contractComparison.multiVoyageRiskScore} / 100 (Low)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono-data text-[#12883E] font-bold">
            <span>Projected Cost Savings:</span>
            <span>+{contractComparison.savingsPercent}% (~{formatSavings(contractComparison.savingsUSD, currencyUnit)})</span>
          </div>
        </div>

        {/* CARD 2: SPOT FIXTURE */}
        <div
          className={`relative rounded-[20px] bg-white p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between shadow-sm ${
            !isMultiRecommended
              ? 'border-2 border-[#0EA5E9] shadow-md ring-2 ring-[#0EA5E9]/20'
              : 'border border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B3342] font-mono-data">
                  Structure B
                </span>
                {!isMultiRecommended && (
                  <StatusBadge
                    label="AI Recommended Strategy"
                    variant="success"
                    size="sm"
                    icon={<Award className="w-3.5 h-3.5" />}
                    pulse
                  />
                )}
              </div>
              <span className="text-xs font-bold font-mono-data px-2.5 py-1 rounded-md bg-slate-100 text-[#101828] border border-slate-200/80">
                Spot Benchmark
              </span>
            </div>

            <h3 className="text-xl font-bold font-heading text-[#101828] mb-1">
              One-Off Spot Market Charter
            </h3>
            <p className="text-xs text-[#2B3342] mb-6 font-sans">
              Prompt market fixture executed per individual voyage with zero forward commitment
            </p>

            {/* Metrics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
              <div className="text-xs font-semibold text-[#2B3342] font-mono-data">Spot Market Freight Baseline</div>
              <div className="text-3xl font-bold font-mono-data text-[#101828] mt-1">
                {formatFreightRate(contractComparison.spotFreightRatePerMT, currencyUnit)}
              </div>
              <div className="text-xs font-bold font-mono-data text-[#2B3342] mt-1">
                Total Commitment: {formatMoney(contractComparison.spotTotalCostUSD, currencyUnit)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Rate Volatility Hedge</span>
                <span className="font-bold font-mono-data text-[#EB1515]">
                  Full 100% market exposure
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Vessel Tonnage Guarantee</span>
                <span className="font-bold font-mono-data text-[#A36907]">
                  Subject to prompt supply
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Operational Flexibility</span>
                <span className="font-bold font-mono-data text-[#101828]">
                  Maximum parcel agility
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[#2B3342] font-medium font-sans">Risk Exposure Index</span>
                <span className="font-bold font-mono-data text-[#EB1515]">
                  {contractComparison.spotRiskScore} / 100 (Elevated)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono-data text-[#2B3342]">
            <span>Volume Discount:</span>
            <span>0.0% (Standard Market Rate)</span>
          </div>
        </div>
      </div>

      {/* RATIONALE SUMMARY CARD */}
      <div className="rounded-[20px] bg-white p-6 sm:p-7 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2 mb-2">
          <IconChip icon={<Sparkles className="w-4 h-4 text-[#0EA5E9]" />} color="teal" size="sm" />
          <h3 className="text-base font-bold font-heading text-[#101828]">
            Contract Strategy Rationale & Justification
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#101828] leading-relaxed font-sans">
          {contractComparison.reasoning}
        </p>
      </div>
    </div>
  );
};
