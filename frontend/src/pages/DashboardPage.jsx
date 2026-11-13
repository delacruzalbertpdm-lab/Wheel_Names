import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserMinus,
  Trophy,
  Sparkles,
  ArrowRight,
  RotateCcw,
  UserPlus,
  History,
  Layers,
  Calendar,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { fetchDashboardSummary } from '../api/drawsApi';
import { usePulseDraw } from '../context/PulseDrawContext';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    poolStats,
    drawConfig,
    setDrawConfig,
    syncStatsFromResponse,
    handleResetEligibilityGlobal,
    handleSeedSamplesGlobal,
  } = usePulseDraw();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
      syncStatsFromResponse(data);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [syncStatsFromResponse]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const total = summary?.total_participants ?? poolStats.total_participants;
  const eligible = summary?.eligible_participants ?? poolStats.eligible_participants;
  const excluded = summary?.excluded_participants ?? poolStats.excluded_participants;
  const totalDraws = summary?.total_draws ?? 0;
  const latestDraw = summary?.latest_draw ?? null;
  const recentDraws = summary?.recent_draws ?? [];
  const departmentBreakdown = summary?.department_breakdown ?? [];

  return (
    <div className="space-y-8">
      {/* Hero Banner (Clean White & Soft Indigo Gradient) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/40 border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-24 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cryptographic Multi-Player Selection Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simultaneous Random Player Selection
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Manage your event roster, choose how many players to draw at once, and reveal all
              selected winners simultaneously through the interactive{' '}
              <span className="text-indigo-600 font-bold">Digital Spotlight Matrix</span>.
            </p>
          </div>

          {/* Quick Launch Card */}
          <div className="w-full lg:w-80 rounded-2xl bg-white border border-slate-200 p-5 shadow-md space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Draw Setup
              </span>
              <span className="text-xs font-mono text-emerald-600 font-bold">
                {eligible} Eligible
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Number of Players to Draw Simultaneously:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() =>
                      setDrawConfig((prev) => ({ ...prev, requestedCount: count }))
                    }
                    className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${drawConfig.requestedCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/arena')}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-md shadow-indigo-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Selection Stage ({drawConfig.requestedCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/arena?fullscreen=1')}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open in Full Screen Draw Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Participants"
          value={total}
          subtitle="Registered in system"
          icon={Users}
          color="indigo"
        />
        <StatCard
          label="Available / Eligible"
          value={eligible}
          badge={total > 0 ? `${Math.round((eligible / total) * 100)}%` : '0%'}
          subtitle="Ready for next draw"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          label="Excluded (Selected)"
          value={excluded}
          subtitle="Awaiting pool reset"
          icon={UserMinus}
          color="amber"
        />
        <StatCard
          label="Configured Draw Size"
          value={drawConfig.requestedCount}
          badge={`${totalDraws} draws run`}
          subtitle={
            drawConfig.excludeWinners ? 'Mode: Auto-Exclude Winners' : 'Mode: Keep Winners Eligible'
          }
          icon={Trophy}
          color="cyan"
        />
      </div>

      {/* Main Two-Column Grid: Latest Draw & Pool Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Latest Draw & Recent Activity */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex-1 flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Most Recent Selection Draw</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestDraw ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{latestDraw.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(latestDraw.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-mono text-xs font-bold text-indigo-700">
                      {latestDraw.requested_count} Selected / {latestDraw.eligible_pool_size} Pool
                    </span>
                  </div>
                </div>

                {/* Winner Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(latestDraw.winners || []).map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: w.avatar_color_snapshot || '#6366F1' }}
                      >
                        {getInitials(w.participant_name_snapshot)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {w.participant_name_snapshot}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {w.participant_department_snapshot || 'General'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-mono text-xs font-bold text-indigo-700">
                        #{w.slot_number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300">
                <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2.5" />
                <p className="text-sm font-bold text-slate-800">No Draws Conducted Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Head to the Selection Arena to select multiple participants simultaneously.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/arena')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start First Draw</span>
                </button>
              </div>
            )}
          </div>

          {/* Previous Draw History Snapshot */}
          {recentDraws.length > 1 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Draw Log
                </h3>
              </div>
              <div className="space-y-2.5">
                {recentDraws.slice(1, 5).map((draw) => (
                  <div
                    key={draw.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{draw.title}</div>
                      <div className="text-slate-500 mt-0.5">
                        {new Date(draw.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-indigo-700 font-mono font-bold">
                        {draw.requested_count} Winners
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pool Actions & Department Distribution */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Administration Actions */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Roster & Eligibility Controls</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/participants')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-left transition-colors"
              >
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Manage Roster</div>
                  <div className="text-[11px] text-slate-500">Add, edit, or import CSV</div>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleResetEligibilityGlobal();
                  loadDashboard();
                }}
                disabled={excluded === 0}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 text-left transition-colors disabled:opacity-40"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Reset Eligibility</div>
                  <div className="text-[11px] text-slate-500">Restore {excluded} excluded</div>
                </div>
              </button>
            </div>

            {total === 0 && !loading && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-indigo-900">
                  Want to test with 20 sample participants right away?
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleSeedSamplesGlobal();
                    loadDashboard();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0"
                >
                  Load 20 Sample Players
                </button>
              </div>
            )}
          </div>

          {/* Department / Group Breakdown */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Participant Groups / Departments</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {departmentBreakdown.length} Groups
              </span>
            </div>

            {departmentBreakdown.length > 0 ? (
              <div className="space-y-3">
                {departmentBreakdown.map((dept) => {
                  const pct = dept.total > 0 ? Math.round((dept.eligible / dept.total) * 100) : 0;
                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{dept.department}</span>
                        <span className="font-mono text-slate-500">
                          <strong className="text-emerald-600">{dept.eligible}</strong> / {dept.total}{' '}
                          eligible
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                No department statistics available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
