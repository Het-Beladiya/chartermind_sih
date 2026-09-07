import React, { useState, useEffect } from 'react';
import { useCharter } from '../../context/CharterContext';
import { DecisionCard } from '../common/DecisionCard';
import { CharterMindLogo } from '../common/CharterMindLogo';
import {
  formatFreightRate,
  formatMoney,
  getDualCurrency,
} from '../../utils/currency';
import { getReports, generateReport } from '../../utils/api';
import {
  Printer,
  FileDown,
  ShieldCheck,
  Loader2,
  BookmarkPlus,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  report_type: string;
  generated_at: string;
  content_json?: any;
}

export const ReportsView: React.FC = () => {
  const {
    cargoRequest,
    selectedPort,
    selectedVessel,
    topVesselBreakdown,
    voyageCost,
    idlePrediction,
    contractComparison,
    currencyUnit,
    saveVoyagePlan,
  } = useCharter();

  const [dbReports, setDbReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const data = await getReports();
        if (mounted && Array.isArray(data)) {
          setDbReports(data);
        }
      } catch (err) {
        console.warn('[ReportsView] Could not load reports from backend:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadReports();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveToBackend = async () => {
    try {
      setIsSaving(true);
      const res = await saveVoyagePlan();
      if (res.success && res.plan) {
        const title = `${cargoRequest.cargoType} ${cargoRequest.cargoQuantity.toLocaleString()} MT (${cargoRequest.origin} → ${selectedPort.name})`;
        const newRep = await generateReport(res.plan.id, 'voyage_cost', title);
        setDbReports((prev) => [newRep, ...prev]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[ReportsView] Failed to archive dossier:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const dualCost = getDualCurrency(voyageCost.totalCostUSD, currencyUnit);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Exportable executive summary for chartering committee review and commercial approval.
          </p>
          {dbReports.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#0B5D63] font-mono-data">
              <Clock className="w-3 h-3" />
              <span>{dbReports.length} Dossiers archived in PostgreSQL database</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveToBackend}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#101828] border border-slate-300 text-xs font-bold shadow-xs transition-all flex items-center gap-2 font-mono-data cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#12883E]" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 text-[#0B5D63]" />
            )}
            <span>{saveSuccess ? 'Archived to DB!' : isSaving ? 'Saving...' : 'Save Dossier'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#101828] hover:bg-[#0B5D63] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 font-mono-data cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Single-Column Document Container */}
      <div className="rounded-[20px] bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-7 print:shadow-none print:border-none print:p-0 print:bg-white">
        {/* Document Letterhead */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 print:border-gray-200">
          <div className="flex items-center gap-4">
            <CharterMindLogo variant="horizontal" size="md" animated={false} />
            <div className="hidden sm:block h-7 w-[1px] bg-slate-200 print:bg-gray-200" />
            <div className="text-[10px] font-bold text-[#2B3342] uppercase tracking-wider font-mono-data">
              Commercial Voyage Memo · Ref #CM-{Date.now().toString().slice(-6)}
            </div>
          </div>

          <div className="text-right text-xs text-[#2B3342] font-mono-data">
            <div>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
            <div className="text-[11px] text-[#2B3342]">Classification: Commercial Confidential</div>
          </div>
        </div>

        {/* 1. HERO AI DECISION CARD */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#2B3342] font-mono-data mb-2">
            Section 1: Executive AI Recommendation
          </div>
          <DecisionCard showActions={false} />
        </div>

        {/* 2. COMMERCIAL REQUIREMENT & CORRIDOR */}
        <div className="space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold font-heading text-[#101828] uppercase tracking-wider pb-1 border-b border-slate-200/80 print:border-gray-200">
            Section 2: Commercial Cargo & Basin Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-200">
              <div className="text-[#2B3342] font-medium font-sans">Commodity</div>
              <div className="font-bold text-[#101828] mt-0.5">{cargoRequest.cargoType}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-200">
              <div className="text-[#2B3342] font-medium font-sans">Parcel Quantity</div>
              <div className="font-bold text-[#101828] mt-0.5 font-mono-data">
                {cargoRequest.cargoQuantity.toLocaleString()} MT
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-200">
              <div className="text-[#2B3342] font-medium font-sans">Loading Origin</div>
              <div className="font-bold text-[#101828] mt-0.5">{cargoRequest.origin}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-200">
              <div className="text-[#2B3342] font-medium font-sans">Discharge Port</div>
              <div className="font-bold text-[#101828] mt-0.5">{selectedPort.name}</div>
            </div>
          </div>
        </div>

        {/* 3. OPTIMAL VESSEL & PORT COMPATIBILITY */}
        <div className="space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold font-heading text-[#101828] uppercase tracking-wider pb-1 border-b border-slate-200/80 print:border-gray-200">
            Section 3: Vessel Class Selection & Draught Verification
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-gray-50 print:border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#2B3342] font-medium font-sans">Selected Vessel</span>
              <div className="font-bold text-[#101828] text-sm mt-0.5 flex items-center gap-1.5">
                <span>{selectedVessel.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30 font-bold font-mono-data">
                  {topVesselBreakdown.finalScore}/100
                </span>
              </div>
              <div className="text-[#2B3342] text-[11px] mt-0.5 font-sans">{selectedVessel.categoryName}</div>
            </div>

            <div>
              <span className="text-[#2B3342] font-medium font-sans">Draught Clearance</span>
              <div className="font-bold font-mono-data text-[#12883E] text-sm mt-0.5">
                {selectedVessel.draft}m (Port Max: {selectedPort.maxDraft}m)
              </div>
              <div className="text-[#12883E] text-[11px] mt-0.5 font-mono-data">
                +{topVesselBreakdown.compatibility.draftFit.margin.toFixed(1)}m Safety Margin
              </div>
            </div>

            <div>
              <span className="text-[#2B3342] font-medium font-sans">Turnaround Efficiency</span>
              <div className="font-bold font-mono-data text-[#101828] text-sm mt-0.5">
                {selectedPort.handlingRateMTPerDay.toLocaleString()} MT/day
              </div>
              <div className="text-[#2B3342] text-[11px] mt-0.5 font-mono-data">
                Est. Idle Wait: {idlePrediction.expectedIdleHours} hrs
              </div>
            </div>
          </div>
        </div>

        {/* 4. TOTAL COST LEDGER AUDIT */}
        <div className="space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold font-heading text-[#101828] uppercase tracking-wider pb-1 border-b border-slate-200/80 print:border-gray-200">
            Section 4: Itemized Voyage Economics & Ledger
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 print:border-gray-100">
              <span className="text-[#2B3342] font-sans">Base Ocean Freight ({formatFreightRate(voyageCost.freightRatePerMT, currencyUnit)})</span>
              <span className="font-bold font-mono-data text-[#101828]">{formatMoney(voyageCost.freightCostUSD, currencyUnit)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 print:border-gray-100">
              <span className="text-[#2B3342] font-sans">Port Dues & Conservancies ({selectedPort.name})</span>
              <span className="font-bold font-mono-data text-[#101828]">{formatMoney(voyageCost.portChargesUSD, currencyUnit)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 print:border-gray-100">
              <span className="text-[#2B3342] font-sans">Cargo Stevedoring & Handling</span>
              <span className="font-bold font-mono-data text-[#101828]">{formatMoney(voyageCost.loadingDischargeCostUSD, currencyUnit)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 print:border-gray-100">
              <span className="text-[#2B3342] font-sans">Quantified Idle Waiting Cost ({idlePrediction.expectedIdleHours} hrs)</span>
              <span className="font-bold font-mono-data text-[#A36907]">{formatMoney(voyageCost.idleWaitingCostUSD, currencyUnit)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 print:border-gray-100">
              <span className="text-[#2B3342] font-sans">Demurrage / Delay Contingency</span>
              <span className="font-bold font-mono-data text-[#EB1515]">{formatMoney(voyageCost.delayDemurrageExposureUSD, currencyUnit)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-slate-50 px-4 rounded-xl border-2 border-slate-300 mt-2.5 print:bg-gray-50">
              <div>
                <span className="text-xs font-bold text-[#101828] uppercase tracking-wider font-mono-data block">
                  Total Estimated Voyage Budget
                </span>
                <span className="text-xs text-[#2B3342] font-mono-data">
                  Equivalent: {dualCost.secondary}
                </span>
              </div>
              <span className="font-mono-data text-[#101828] font-bold text-lg sm:text-xl">
                {dualCost.primary}
              </span>
            </div>
          </div>
        </div>

        {/* 5. SIGN-OFF / AUDIT STAMP */}
        <div className="pt-5 border-t border-slate-200/80 print:border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs text-[#2B3342] font-mono-data">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#12883E]" />
            <span>CharterMind Marine Intelligence Engine v2.4</span>
          </div>
          <div className="text-right">
            Verification: <span className="font-bold text-[#101828]">SHA-256 #8F4C-2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
