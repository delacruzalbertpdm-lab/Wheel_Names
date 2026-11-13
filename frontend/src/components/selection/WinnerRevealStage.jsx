import React from 'react';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Building2,
  Maximize2,
  Mail,
} from 'lucide-react';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Simultaneous Kinetic Winner Cards Reveal Stage — Balanced & Symmetric Edition.
 * Automatically adapts card sizing and grid symmetry based on the number of winners (1..N)
 * so there are never awkward orphan cards or mismatched card heights, and everything fits
 * cleanly inside the Full-Screen stage viewport.
 */
export default function WinnerRevealStage({
  drawResult,
  onDrawAgain,
  onReturnToMatrix,
  onResetEligibility,
  eligibleRemaining,
  excludedCount,
  isFullscreen = false,
  onToggleFullscreen,
}) {
  if (!drawResult) return null;

  const winners = drawResult.winners || [];
  const count = winners.length;
  const drawDate = new Date(drawResult.created_at).toLocaleString();

  // Determine whether we have 2+ rows of cards so we can scale card height to fit 100vh cleanly
  const isMultiRow = count >= 6;
  const isDense = count >= 9;

  // Choose a symmetric grid configuration based on winner count:
  // 1 -> 1 col (centered)
  // 2 -> 2 cols
  // 3 -> 3 cols
  // 4 -> 4 cols
  // 5 -> 5 cols (1 symmetric row of 5)
  // 6 -> 3 cols x 2 symmetric rows (3 on top, 3 on bottom!)
  // 7-8 -> 4 cols x 2 rows
  // 9 -> 3 cols x 3 rows
  // 10 -> 5 cols x 2 rows
  // 11+ -> 4 or 5 cols
  const getGridClass = () => {
    if (count === 1) return 'grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto';
    if (count === 5) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    if (count === 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto';
    if (count <= 8) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto';
    if (count === 9) return 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 max-w-5xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col justify-between ${
        isFullscreen
          ? 'flex-1 h-[calc(100vh-5.25rem)] p-5 sm:p-7'
          : 'p-6 sm:p-8 space-y-6'
      }`}
    >
      {/* Subtle Ambient Stage Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-48 bg-gradient-to-b from-indigo-500/8 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Section: Stage Banner Header (Always visible at top of stage) */}
      <div className="relative shrink-0">
        {onToggleFullscreen && !isFullscreen && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen Stage</span>
            </button>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Simultaneous Selection Complete • {count} Selected</span>
          </div>

          <h2
            className={`font-extrabold text-slate-900 tracking-tight ${
              isFullscreen
                ? isMultiRow
                  ? 'text-2xl sm:text-3xl'
                  : 'text-3xl sm:text-4xl'
                : 'text-2xl sm:text-3xl'
            }`}
          >
            {drawResult.title || 'Selected Participants'}
          </h2>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{drawDate}</span>
            </span>
            <span>•</span>
            <span>
              Selected <strong className="text-slate-800">{drawResult.requested_count}</strong> from{' '}
              <strong className="text-slate-800">{drawResult.eligible_pool_size}</strong> eligible players
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {drawResult.exclude_winners
                  ? 'Winners auto-excluded from next draw'
                  : 'Winners kept eligible'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Symmetric Winner Cards Grid */}
      <div className="relative flex-1 flex items-center justify-center my-3 overflow-y-auto px-1">
        <div className={`w-full grid gap-4 sm:gap-5 items-stretch ${getGridClass()}`}>
          {winners.map((winner, idx) => (
            <div
              key={winner.id || idx}
              style={{ animationDelay: `${idx * 65}ms` }}
              className={`animate-card-reveal relative group overflow-hidden rounded-2xl bg-gradient-to-b from-white to-slate-50/90 border-2 border-indigo-100 hover:border-indigo-400 shadow-md hover:shadow-xl transition-all flex flex-col justify-between items-center text-center ${
                isDense
                  ? 'p-4'
                  : isMultiRow
                  ? 'p-5 sm:p-6'
                  : isFullscreen
                  ? 'p-7 sm:p-8'
                  : 'p-6'
              }`}
            >
              {/* Top Glowing Accent Bar */}
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: winner.avatar_color_snapshot || '#6366F1' }}
              />

              {/* Top Row: Winner Slot Number Pill & Badge */}
              <div className="w-full flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 font-mono text-xs font-extrabold text-indigo-700">
                  #{winner.slot_number}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  WINNER
                </span>
              </div>

              {/* Center Avatar & Identity */}
              <div className="flex flex-col items-center justify-center my-auto w-full">
                <div
                  className={`${
                    isDense
                      ? 'w-14 h-14 text-lg mb-2.5'
                      : isMultiRow
                      ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl mb-3'
                      : isFullscreen
                      ? 'w-24 h-24 text-3xl mb-4'
                      : 'w-20 h-20 text-2xl mb-3.5'
                  } rounded-2xl flex items-center justify-center font-extrabold text-white shadow-md ring-4 ring-slate-100 group-hover:scale-105 transition-transform shrink-0`}
                  style={{ backgroundColor: winner.avatar_color_snapshot || '#6366F1' }}
                >
                  {getInitials(winner.participant_name_snapshot)}
                </div>

                {/* Single-line or uniform-height Winner Name */}
                <h3
                  className={`${
                    isDense
                      ? 'text-base'
                      : isMultiRow
                      ? 'text-lg sm:text-xl'
                      : isFullscreen
                      ? 'text-xl sm:text-2xl'
                      : 'text-lg sm:text-xl'
                  } font-extrabold text-slate-900 tracking-tight truncate w-full px-1`}
                  title={winner.participant_name_snapshot}
                >
                  {winner.participant_name_snapshot}
                </h3>
              </div>

              {/* Bottom Metadata Footer (Always aligned across all cards in the row) */}
              <div className="w-full mt-3 pt-2.5 border-t border-slate-100 flex flex-col items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 max-w-full truncate">
                  <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    {winner.participant_department_snapshot || 'General'}
                  </span>
                </div>

                {winner.participant_email_snapshot && !isDense && (
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-full">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{winner.participant_email_snapshot}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Stage Action Controls */}
      <div className="relative shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onReturnToMatrix}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Spotlight Matrix ({eligibleRemaining} Eligible Left)</span>
        </button>

        <div className="w-full sm:w-auto flex items-center justify-end gap-3">
          {excludedCount > 0 && (
            <button
              type="button"
              onClick={onResetEligibility}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>Reset All Eligibility ({excludedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDrawAgain}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-md shadow-indigo-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Conduct Another Draw</span>
          </button>
        </div>
      </div>
    </div>
  );
}
