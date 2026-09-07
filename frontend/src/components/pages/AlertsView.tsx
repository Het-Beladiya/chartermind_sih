import React, { useEffect, useState } from 'react';
import { useCharter } from '../../context/CharterContext';
import { IconChip } from '../common/IconChip';
import { getAlerts, dismissAlert as apiDismissAlert } from '../../utils/api';
import { AlertItem } from '../../types';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts: contextAlerts, dismissAlert: contextDismissAlert, setActiveTab } = useCharter();
  const [alerts, setAlerts] = useState<AlertItem[]>(contextAlerts);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real-time alerts from FastAPI backend on mount
  useEffect(() => {
    let mounted = true;
    const fetchApiAlerts = async () => {
      try {
        setIsLoading(true);
        const data = await getAlerts();
        if (mounted && Array.isArray(data) && data.length > 0) {
          const mapped: AlertItem[] = data.map((a: any) => ({
            id: a.id,
            type: a.type || 'info',
            title: a.title,
            message: a.message,
            timestamp: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
            impactMetric: a.impact_metric || undefined,
            actionRequired: !!a.action_required,
          }));
          setAlerts(mapped);
        }
      } catch (err) {
        console.warn('[AlertsView] Could not load alerts from backend, using default live feed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchApiAlerts();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDismiss = async (id: string) => {
    // 1. Optimistic UI update
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    contextDismissAlert(id);

    // 2. Call backend dismiss endpoint
    try {
      await apiDismissAlert(id);
    } catch (err) {
      console.warn('[AlertsView] Could not dismiss alert on backend:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm">
        <div>
          <p className="text-xs sm:text-sm text-[#2B3342] font-sans">
            Real-time notifications covering port congestion queues, Baltic freight spikes, and weather advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono-data text-[#101828] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#0B5D63]" />}
            <span>Active: <strong className="text-[#EB1515]">{alerts.length} Advisories</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('what-if')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#101828] hover:bg-[#0B5D63] shadow-xs flex items-center gap-1.5 shrink-0 font-mono-data cursor-pointer transition-colors"
          >
            <span>Run Simulation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-[20px] bg-white p-12 text-center shadow-sm border border-slate-200/80">
            <div className="w-12 h-12 rounded-xl bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-heading text-[#101828]">All Clear — No Active Advisories</h3>
            <p className="text-xs text-[#2B3342] mt-1 max-w-sm mx-auto font-sans">
              Voyage operations across selected Bay of Bengal ports are within baseline safety tolerances.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isDanger = alert.type === 'danger';
            const isWarning = alert.type === 'warning';
            const isSuccess = alert.type === 'success';

            return (
              <div
                key={alert.id}
                className="rounded-[20px] bg-white p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {isDanger && <IconChip icon={<AlertTriangle className="w-4 h-4 text-[#EB1515]" />} color="rose" size="md" />}
                    {isWarning && <IconChip icon={<Bell className="w-4 h-4 text-[#A36907]" />} color="amber" size="md" />}
                    {isSuccess && <IconChip icon={<CheckCircle2 className="w-4 h-4 text-[#12883E]" />} color="emerald" size="md" />}
                    {!isDanger && !isWarning && !isSuccess && (
                      <IconChip icon={<Info className="w-4 h-4 text-[#0EA5E9]" />} color="teal" size="md" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#101828] font-heading">{alert.title}</h4>
                      {alert.impactMetric && (
                        <span
                          className={`text-[10px] font-bold font-mono-data px-2 py-0.5 rounded-md ${
                            isDanger
                              ? 'bg-[#EB1515]/15 text-[#EB1515] border border-[#EB1515]/30'
                              : isWarning
                              ? 'bg-[#A36907]/15 text-[#A36907] border border-[#A36907]/30'
                              : 'bg-[#12883E]/15 text-[#12883E] border border-[#12883E]/30'
                          }`}
                        >
                          {alert.impactMetric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#101828] mt-1 leading-relaxed font-sans">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-xs font-mono-data text-[#2B3342]">{alert.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EB1515] hover:bg-[#EB1515]/10 transition-colors cursor-pointer"
                    title="Dismiss alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-[#101828] font-mono-data">
          <Sparkles className="w-4 h-4 text-[#0EA5E9] shrink-0" />
          <span>Simulate these market triggers in the What-If stress tester</span>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('what-if')}
          className="text-xs font-bold text-[#0EA5E9] hover:underline flex items-center gap-1 cursor-pointer font-mono-data"
        >
          <span>Open Sensitivity Simulator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
