import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDashboardSummary } from '../api/drawsApi';
import { resetAllEligibility, seedSampleParticipants } from '../api/participantsApi';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const PulseDrawContext = createContext(null);

export function PulseDrawProvider({ children }) {
  const [poolStats, setPoolStats] = useState({
    total_participants: 0,
    eligible_participants: 0,
    excluded_participants: 0,
    departments: [],
  });
  const [drawConfig, setDrawConfig] = useState({
    requestedCount: 3,
    excludeWinners: true,
    title: 'Main Stage Activity Draw',
  });
  const [toasts, setToasts] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const syncStatsFromResponse = useCallback((statsObj) => {
    if (!statsObj) return;
    setPoolStats((prev) => ({
      total_participants: statsObj.total_participants ?? prev.total_participants,
      eligible_participants: statsObj.eligible_participants ?? prev.eligible_participants,
      excluded_participants: statsObj.excluded_participants ?? prev.excluded_participants,
      departments: statsObj.departments ?? prev.departments,
    }));
  }, []);

  const refreshPoolStats = useCallback(async () => {
    try {
      const data = await fetchDashboardSummary();
      syncStatsFromResponse(data);
      return data;
    } catch {
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  }, [syncStatsFromResponse]);

  useEffect(() => {
    refreshPoolStats();
  }, [refreshPoolStats]);

  const handleResetEligibilityGlobal = useCallback(async () => {
    try {
      const res = await resetAllEligibility();
      syncStatsFromResponse(res.stats);
      addToast(res.message || 'All participants are now eligible for selection.', 'success');
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to reset eligibility.', 'error');
      throw err;
    }
  }, [syncStatsFromResponse, addToast]);

  const handleSeedSamplesGlobal = useCallback(async () => {
    try {
      const res = await seedSampleParticipants();
      syncStatsFromResponse(res.stats);
      addToast(res.message || 'Sample participants loaded.', 'success');
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to load sample participants.', 'error');
      throw err;
    }
  }, [syncStatsFromResponse, addToast]);

  return (
    <PulseDrawContext.Provider
      value={{
        poolStats,
        isLoadingStats,
        drawConfig,
        setDrawConfig,
        syncStatsFromResponse,
        refreshPoolStats,
        handleResetEligibilityGlobal,
        handleSeedSamplesGlobal,
        addToast,
      }}
    >
      {children}

      {/* Floating Toast Stack (Light Theme) */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-xl backdrop-blur-xl transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-white border-rose-300 text-rose-900 shadow-rose-100'
                : toast.type === 'warning'
                ? 'bg-white border-amber-300 text-amber-900 shadow-amber-100'
                : 'bg-white border-emerald-300 text-slate-800 shadow-slate-200/80'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-semibold leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </PulseDrawContext.Provider>
  );
}

export function usePulseDraw() {
  const context = useContext(PulseDrawContext);
  if (!context) {
    throw new Error('usePulseDraw must be used within a PulseDrawProvider');
  }
  return context;
}
