import React from 'react';
import { useCharter } from '../../context/CharterContext';
import {
  CongestionLevel,
  WeatherCondition,
  AvailabilityStatus,
} from '../../types';
import { IconChip } from '../common/IconChip';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatFreightRate,
  formatMoney,
  getDualCurrency,
} from '../../utils/currency';
import {
  RotateCcw,
  TrendingUp,
  Clock,
  Coins,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const WhatIfSimulatorView: React.FC = () => {
  const {
    simulatorOverrides,
    setSimulatorOverrides,
    resetSimulatorOverrides,
    voyageCost,
    idlePrediction,
    riskScores,
    forecast,
    cargoRequest,
    selectedPort,
    currencyUnit,
  } = useCharter();

  const dualTotal = getDualCurrency(voyageCost.totalCostUSD, currencyUnit);

  // Charter timing simulator data for 4 horizons
  const timingOptions = [
    { label: 'Prompt Entry (Day 0)', days: 0, rateDelta: 0, risk: riskScores.bucket, isRecommended: forecast.trend === 'Rising' },
    { label: '+7 Days Laycan', days: 7, rateDelta: forecast.trend === 'Rising' ? 1.4 : -1.1, risk: riskScores.overallScore > 65 ? 'High' : 'Medium', isRecommended: forecast.trend === 'Falling' },
    { label: '+14 Days Forward', days: 14, rateDelta: forecast.trend === 'Rising' ? 2.8 : -2.3, risk: 'Medium', isRecommended: false },
    { label: '+30 Days Horizon', days: 30, rateDelta: forecast.trend === 'Rising' ? 4.5 : -3.8, risk: 'High', isRecommended: false },
  ];

  const congestionOptions: CongestionLevel[] = ['Low', 'Medium', 'High', 'Critical'];
  const weatherOptions: WeatherCondition[] = ['Normal', 'Rough', 'Severe'];
  const availOptions: AvailabilityStatus[] = ['Available', 'Limited', 'Scarce'];

  const hasOverrides =
    simulatorOverrides.congestion !== selectedPort.congestion ||
    simulatorOverrides.weather !== 'Normal' ||
    simulatorOverrides.freightRateOffsetPercent !== 0 ||
    simulatorOverrides.vesselAvailability !== 'Available';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Simulate operational disruptions, weather swings, and freight volatility to see live recalculated deltas.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSimulatorOverrides}
          disabled={!hasOverrides}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 font-mono-data cursor-pointer ${
            hasOverrides
              ? 'bg-slate-100 hover:bg-slate-200 text-[#101828] border-slate-300 shadow-xs'
              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#2B3342]" strokeWidth={2.25} />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Main Grid: Control Panel (Left 4 cols) + Live Recalculated Output (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 4 COLS: CONTROL CARD */}
        <div className="lg:col-span-4 rounded-[20px] bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-base font-bold font-heading text-[#101828]">
              Scenario Control Levers
            </h3>
            <span className="text-[10px] font-bold text-[#12883E] font-mono-data bg-[#12883E]/15 border border-[#12883E]/30 px-2 py-0.5 rounded-md">
              Live Engine
            </span>
          </div>

          {/* 1. Port Congestion */}
          <div>
            <label className="block text-[10px] font-bold text-[#2B3342] uppercase tracking-wider mb-1.5 font-mono-data">
              Port Congestion ({selectedPort.name.split(' ')[0]})
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {congestionOptions.map((lvl) => {
                const isSelected = simulatorOverrides.congestion === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSimulatorOverrides((prev) => ({ ...prev, congestion: lvl }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all font-mono-data cursor-pointer ${
                      isSelected
                        ? 'bg-[#101828] text-white shadow-xs'
                        : 'bg-slate-50 text-[#101828] hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Weather Condition */}
          <div>
            <label className="block text-[10px] font-bold text-[#2B3342] uppercase tracking-wider mb-1.5 font-mono-data">
              Weather & Sea State
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {weatherOptions.map((w) => {
                const isSelected = simulatorOverrides.weather === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSimulatorOverrides((prev) => ({ ...prev, weather: w }))}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all font-mono-data cursor-pointer ${
                      isSelected
                        ? 'bg-[#101828] text-white shadow-xs'
                        : 'bg-slate-50 text-[#101828] hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Freight Rate Stress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-[#2B3342] uppercase tracking-wider font-mono-data">
                Freight Rate Shock
              </label>
              <span
                className={`text-xs font-bold font-mono-data px-2 py-0.5 rounded-md ${
                  simulatorOverrides.freightRateOffsetPercent > 0
                    ? 'bg-[#EB1515]/15 text-[#EB1515] border border-[#EB1515]/30'
                    : simulatorOverrides.freightRateOffsetPercent < 0
                    ? 'bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30'
                    : 'bg-slate-100 text-[#101828] border border-slate-200/80'
                }`}
              >
                {simulatorOverrides.freightRateOffsetPercent > 0 ? '+' : ''}
                {simulatorOverrides.freightRateOffsetPercent}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={30}
              step={2}
              value={simulatorOverrides.freightRateOffsetPercent}
              onChange={(e) =>
                setSimulatorOverrides((prev) => ({
                  ...prev,
                  freightRateOffsetPercent: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-slate-200 border border-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
            />
            <div className="flex justify-between text-[10px] text-[#2B3342] font-mono-data mt-1">
              <span>-20% Drop</span>
              <span>Baseline</span>
              <span>+30% Spike</span>
            </div>
          </div>

          {/* 4. Vessel Availability */}
          <div>
            <label className="block text-[10px] font-bold text-[#2B3342] uppercase tracking-wider mb-1.5 font-mono-data">
              Regional Vessel Fleet Availability
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {availOptions.map((av) => {
                const isSelected = simulatorOverrides.vesselAvailability === av;
                return (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSimulatorOverrides((prev) => ({ ...prev, vesselAvailability: av }))}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all font-mono-data cursor-pointer ${
                      isSelected
                        ? 'bg-[#101828] text-white shadow-xs'
                        : 'bg-slate-50 text-[#101828] hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {av}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 8 COLS: DYNAMIC RECALCULATED DELTA TILES */}
        <div className="lg:col-span-8 space-y-6">
          {/* 4 Recalculated Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Budget Delta */}
            <div className="rounded-[20px] bg-white p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data">
                  Simulated Total Voyage Budget
                </span>
                <IconChip icon={<Coins className="w-4 h-4 text-[#101828]" />} color="teal" size="sm" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-data text-[#101828] my-1">
                {dualTotal.primary}
              </div>
              <div className="text-xs font-semibold text-[#12883E] font-mono-data">
                {formatFreightRate(voyageCost.costPerMTUSD, currencyUnit)} All-in freight & fees
              </div>
            </div>

            {/* Idle Hours Delta */}
            <div className="rounded-[20px] bg-white p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data">
                  Turnaround / Idle Wait Time
                </span>
                <IconChip icon={<Clock className="w-4 h-4 text-[#101828]" />} color="amber" size="sm" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-data text-[#A36907] my-1">
                {idlePrediction.expectedIdleHours}{' '}
                <span className="text-base font-semibold text-[#2B3342]">hours</span>
              </div>
              <div className="text-xs font-semibold text-[#2B3342] font-mono-data">
                Idle Expense: {formatMoney(idlePrediction.idleCostUSD, currencyUnit)}
              </div>
            </div>

            {/* Recalculated Risk Level */}
            <div className="rounded-[20px] bg-white p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data">
                  Simulated Risk Exposure
                </span>
                <IconChip icon={<ShieldAlert className="w-4 h-4 text-[#101828]" />} color="rose" size="sm" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-data text-[#101828] my-1 flex items-center gap-2">
                <span>{riskScores.overallScore} / 100</span>
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
              <div className="text-xs text-[#2B3342] font-sans">
                Driver: <span className="font-semibold text-[#101828] font-heading">{riskScores.primaryDriver}</span>
              </div>
            </div>

            {/* Ocean Freight Rate MT */}
            <div className="rounded-[20px] bg-white p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data">
                  Active Freight Rate
                </span>
                <IconChip icon={<TrendingUp className="w-4 h-4 text-[#101828]" />} color="blue" size="sm" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-data text-[#101828] my-1">
                {formatFreightRate(voyageCost.freightRatePerMT, currencyUnit)}
              </div>
              <div className="text-xs text-[#2B3342] font-mono-data">
                Base Freight: {formatMoney(voyageCost.freightCostUSD, currencyUnit)}
              </div>
            </div>
          </div>

          {/* CHARTER TIMING SIMULATOR TABLE */}
          <div className="rounded-[20px] bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/80">
              <IconChip icon={<Calendar className="w-4 h-4 text-[#101828]" />} color="blue" size="sm" />
              <h3 className="text-base font-bold font-heading text-[#101828]">
                Forward Charter Timing Matrix (4 Scenarios)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[#2B3342] font-bold uppercase text-[10px] tracking-wider font-mono-data">
                    <th className="pb-2.5">Entry Timing</th>
                    <th className="pb-2.5">Projected Freight Rate</th>
                    <th className="pb-2.5">Estimated Budget</th>
                    <th className="pb-2.5">Risk Level</th>
                    <th className="pb-2.5 text-right">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timingOptions.map((opt, i) => {
                    const simulatedRate = +(voyageCost.freightRatePerMT + opt.rateDelta).toFixed(2);
                    const simulatedTotal = Math.round(
                      simulatedRate * cargoRequest.cargoQuantity +
                        voyageCost.portChargesUSD +
                        voyageCost.loadingDischargeCostUSD +
                        voyageCost.idleWaitingCostUSD
                    );

                    return (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          opt.isRecommended
                            ? 'bg-[#12883E]/10 font-semibold'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-2">
                          <div className="font-bold text-[#101828] font-heading">{opt.label}</div>
                          <div className="text-[11px] text-[#2B3342] font-mono-data">
                            T + {opt.days} days
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono-data font-bold text-[#101828]">
                          {formatFreightRate(simulatedRate, currencyUnit)}{' '}
                          <span
                            className={`text-xs ${
                              opt.rateDelta > 0
                                ? 'text-[#EB1515]'
                                : opt.rateDelta < 0
                                ? 'text-[#12883E]'
                                : 'text-[#2B3342]'
                            }`}
                          >
                            ({opt.rateDelta > 0 ? '+' : ''}{formatFreightRate(opt.rateDelta, currencyUnit)})
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono-data font-bold text-[#101828]">
                          {formatMoney(simulatedTotal, currencyUnit)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md font-bold font-mono-data ${
                              opt.risk === 'Low'
                                ? 'bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30'
                                : opt.risk === 'Medium'
                                ? 'bg-[#A36907]/15 text-[#A36907] border border-[#A36907]/30'
                                : 'bg-[#EB1515]/15 text-[#EB1515] border border-[#EB1515]/30'
                            }`}
                          >
                            {opt.risk}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {opt.isRecommended ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-[#12883E] text-white shadow-xs font-mono-data">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>AI Top Pick</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#2B3342] font-medium font-sans">Alternative</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SIMULATION IMPACT ANALYSIS & OUTCOME NARRATIVE */}
      <div className="rounded-[20px] bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2 mb-2">
          <IconChip icon={<Sparkles className="w-4 h-4 text-[#0EA5E9]" />} color="teal" size="sm" />
          <h3 className="text-base font-bold font-heading text-[#101828]">
            Simulation Impact Analysis & Strategic Outcome
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#101828] leading-relaxed font-sans">
          Under current simulated parameters ({simulatorOverrides.congestion} port congestion, {simulatorOverrides.weather.toLowerCase()} weather state, and a {simulatorOverrides.freightRateOffsetPercent >= 0 ? `+${simulatorOverrides.freightRateOffsetPercent}%` : `${simulatorOverrides.freightRateOffsetPercent}%`} rate shock), all-in voyage exposure recalibrates to <span className="font-semibold text-[#101828]">{dualTotal.primary}</span> ({formatFreightRate(voyageCost.costPerMTUSD, currencyUnit)}/MT). Total turnaround wait time is modeled at <span className="font-semibold text-[#101828]">{idlePrediction.expectedIdleHours} hours</span> (~{(idlePrediction.expectedIdleHours / 24).toFixed(1)} days), carrying an idle exposure of <span className="font-semibold text-[#101828]">{formatMoney(idlePrediction.idleCostUSD, currencyUnit)}</span>. Recommended fixture timing favors <span className="font-semibold text-[#0EA5E9]">{timingOptions.find(t => t.isRecommended)?.label || 'Prompt Entry'}</span> for optimal rate stabilization.
        </p>
      </div>
    </div>
  );
};
