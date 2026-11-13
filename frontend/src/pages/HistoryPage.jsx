import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Trash2,
  Calendar,
  Trophy,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  fetchDrawHistory,
  deleteDrawSession,
  clearAllDrawHistory,
} from '../api/drawsApi';
import { usePulseDraw } from '../context/PulseDrawContext';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const {
    poolStats,
    syncStatsFromResponse,
    handleResetEligibilityGlobal,
    addToast,
  } = usePulseDraw();

  const [draws, setDraws] = useState([]);
  const [totalDrawsCount, setTotalDrawsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [drawToDelete, setDrawToDelete] = useState(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDrawHistory(searchQuery.trim());
      setDraws(data.results || []);
      setTotalDrawsCount(data.total_draws ?? 0);
      syncStatsFromResponse(data.stats);
    } catch (err) {
      addToast(err.message || 'Failed to load draw history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, syncStatsFromResponse, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const handleConfirmDeleteSingle = async () => {
    if (!drawToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDrawSession(drawToDelete.id);
      addToast('Draw history record deleted.', 'success');
      setDrawToDelete(null);
      await loadHistory();
    } catch (err) {
      addToast(err.message || 'Failed to delete draw record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      const res = await clearAllDrawHistory();
      addToast(res.message || 'Draw history cleared.', 'success');
      setIsClearAllOpen(false);
      await loadHistory();
    } catch (err) {
      addToast(err.message || 'Failed to clear draw history.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Draw History & Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past simultaneous draws, selected winners, pool sizes, and timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {poolStats.excluded_participants > 0 && (
            <button
              type="button"
              onClick={handleResetEligibilityGlobal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>Reset Eligibility ({poolStats.excluded_participants})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/arena')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Conduct New Draw</span>
          </button>
        </div>
      </div>

      {/* Search & Clear Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by round title, winner name, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            Total Recorded Draws: <strong className="text-slate-900">{totalDrawsCount}</strong>
          </span>

          {totalDrawsCount > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Draw History Cards */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading draw history...</p>
        </div>
      ) : draws.length > 0 ? (
        <div className="space-y-4">
          {draws.map((draw) => (
            <div
              key={draw.id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-sm transition-all space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 font-mono text-xs font-bold text-indigo-700">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      {draw.requested_count} Selected
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {draw.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(draw.created_at).toLocaleString()}</span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyan-600" />
                      <span>
                        Drawn from <strong>{draw.eligible_pool_size}</strong> eligible (out of{' '}
                        {draw.total_pool_size} total)
                      </span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {draw.exclude_winners ? 'Winners Excluded After Draw' : 'Winners Kept Eligible'}
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawToDelete(draw)}
                  className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete this draw record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Winners Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(draw.winners || []).map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: winner.avatar_color_snapshot || '#6366F1' }}
                    >
                      {getInitials(winner.participant_name_snapshot)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {winner.participant_name_snapshot}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {winner.participant_department_snapshot || 'General'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-xs font-bold text-indigo-700">
                      #{winner.slot_number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Draw History Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {totalDrawsCount === 0
                ? 'No random selections have been conducted yet. Start a draw in the Selection Arena to record winners here.'
                : 'No draw sessions match your current search filter.'}
            </p>
          </div>
          {totalDrawsCount === 0 && (
            <button
              type="button"
              onClick={() => navigate('/arena')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Go to Selection Arena</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Single Draw Modal */}
      <ConfirmModal
        isOpen={Boolean(drawToDelete)}
        onClose={() => setDrawToDelete(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="Delete Draw Record"
        message={
          drawToDelete
            ? `Are you sure you want to delete "${drawToDelete.title}" (${drawToDelete.requested_count} winners) from history?`
            : ''
        }
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Clear All History Modal */}
      <ConfirmModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear All Draw History"
        message="Are you sure you want to permanently clear all recorded draw sessions? Current participant eligibility will not be changed."
        confirmText="Clear All History"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
