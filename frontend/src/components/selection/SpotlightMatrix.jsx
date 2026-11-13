import React from 'react';
import {
  Radio,
  Sparkles,
  Lock,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Users,
} from 'lucide-react';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Digital Spotlight Matrix — Full-Viewport Responsive Stage Edition.
 * Automatically scales tile density and row heights in Full-Screen mode so
 * there is no wasted blank space at the bottom of the screen.
 */
export default function SpotlightMatrix({
  eligibleParticipants,
  stageState, // 'idle' | 'scanning' | 'locked'
  activeSpotlightIds = [],
  lockedWinnerIds = [],
  scanProgress = 0,
  requestedCount = 1,
  isFullscreen = false,
  onToggleFullscreen,
  onStartDraw,
  canStartDraw = true,
  excludeWinners = true,
  totalCount = 0,
}) {
  const spotlightSet = new Set(activeSpotlightIds);
  const winnerSet = new Set(lockedWinnerIds);
  const count = eligibleParticipants.length;

  // Choose symmetric column count so 20 players form a clean 5x4 grid without orphan bottom rows
  const gridColsClass =
    count <= 8
      ? 'grid-cols-2 sm:grid-cols-4'
      : count <= 12
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      : count <= 20
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col justify-between ${
        isFullscreen
          ? 'flex-1 h-[calc(100vh-5.25rem)] p-5 sm:p-7'
          : 'p-5 sm:p-7'
      }`}
    >
      {/* Subtle Ambient Stage Background Glow */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Stage Telemetry Header + Progress Bar */}
      <div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                stageState === 'scanning'
                  ? 'bg-cyan-500 animate-ping'
                  : stageState === 'locked'
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600'
              }`}
            />
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Digital Spotlight Matrix</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {eligibleParticipants.length} ELIGIBLE PLAYERS
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {stageState === 'scanning'
                  ? `Quantum CSPRNG spotlights sweeping eligible pool for ${requestedCount} simultaneous target(s)...`
                  : stageState === 'locked'
                  ? `Target lock acquired! Elevating ${lockedWinnerIds.length} selected player(s) to center stage...`
                  : 'All eligible participants are loaded in the matrix. Click Start Selection to launch simultaneous spotlights.'}
              </p>
            </div>
          </div>

          {/* Status Pill & Fullscreen Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {stageState === 'scanning' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-800 text-xs font-mono font-bold">
                <Radio className="w-4 h-4 animate-pulse text-cyan-600" />
                <span>SCANNING {Math.min(100, Math.round(scanProgress))}%</span>
              </div>
            )}
            {stageState === 'locked' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold animate-bounce">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>{lockedWinnerIds.length} TARGETS LOCKED</span>
              </div>
            )}
            {stageState === 'idle' && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>READY FOR DRAW</span>
              </div>
            )}

            {onToggleFullscreen && !isFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
                title="Enter Full Screen Stage"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </button>
            )}
          </div>
        </div>

        {/* Scanning Progress Bar */}
        {stageState !== 'idle' && (
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-5">
            <div
              className={`h-full transition-all duration-150 ${
                stageState === 'locked'
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500'
              }`}
              style={{ width: `${stageState === 'locked' ? 100 : scanProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Middle Section: Participant Tile Matrix Grid (Expands to fill Full-Screen stage) */}
      <div
        className={`relative grid ${gridColsClass} ${
          isFullscreen
            ? 'flex-1 gap-4 sm:gap-5 auto-rows-fr my-1'
            : 'gap-3.5 sm:gap-4'
        }`}
      >
        {eligibleParticipants.map((participant, index) => {
          const isSpotlighted = stageState === 'scanning' && spotlightSet.has(participant.id);
          const isLockedWinner = stageState === 'locked' && winnerSet.has(participant.id);
          const isDimmed =
            (stageState === 'scanning' && !isSpotlighted) ||
            (stageState === 'locked' && !isLockedWinner);

          return (
            <div
              key={participant.id}
              className={`relative overflow-hidden rounded-2xl transition-all duration-150 select-none border flex flex-col justify-between ${
                isFullscreen ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'
              } ${
                isLockedWinner
                  ? 'bg-emerald-50/95 border-2 border-emerald-500 scale-[1.03] z-10 animate-spotlight-lock'
                  : isSpotlighted
                  ? 'bg-indigo-50/95 border-2 border-indigo-500 scale-[1.03] shadow-lg shadow-indigo-500/20 z-10'
                  : isDimmed
                  ? 'bg-slate-50 border-slate-200/60 opacity-40 scale-[0.98]'
                  : 'bg-gradient-to-b from-white to-slate-50/60 border-slate-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {/* Spotlight Top Beam Effect */}
              {(isSpotlighted || isLockedWinner) && (
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 ${
                    isLockedWinner
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                      : 'bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-600'
                  }`}
                />
              )}

              <div className="flex items-center gap-3.5">
                <div
                  className={`${
                    isFullscreen
                      ? 'w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base'
                      : 'w-10 h-10 text-xs'
                  } rounded-2xl flex items-center justify-center font-extrabold text-white shrink-0 shadow-sm transition-transform ${
                    isSpotlighted || isLockedWinner ? 'scale-110 ring-2 ring-indigo-500/40' : ''
                  }`}
                  style={{ backgroundColor: participant.avatar_color || '#6366F1' }}
                >
                  {getInitials(participant.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`${
                      isFullscreen ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                    } font-extrabold text-slate-900 truncate leading-snug`}
                  >
                    {participant.full_name}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                    {participant.department || 'General'}
                  </div>
                </div>
              </div>

              {/* Card Bottom Telemetry Row in Fullscreen or Winner Lock */}
              {isLockedWinner ? (
                <div className="mt-3 pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px] font-mono font-bold text-emerald-700">
                  <span>TARGET LOCKED</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ) : isFullscreen ? (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>SLOT #{String(index + 1).padStart(2, '0')}</span>
                  <span
                    className={`font-semibold ${
                      isSpotlighted ? 'text-indigo-600' : 'text-emerald-600'
                    }`}
                  >
                    {isSpotlighted ? 'SCANNING' : 'ELIGIBLE'}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Bottom Stage Footer Bar (Fills and anchors the bottom of the Full-Screen stage) */}
      {isFullscreen && (
        <div className="relative mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs text-slate-600 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                Pool: <strong className="text-slate-900 font-mono">{eligibleParticipants.length}</strong> of{' '}
                <strong className="text-slate-900 font-mono">{totalCount || eligibleParticipants.length}</strong> Eligible
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>
                Simultaneous Draw Size:{' '}
                <strong className="text-indigo-700 font-mono">{requestedCount} Player(s)</strong>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {excludeWinners ? 'Mode: Auto-Exclude Winners' : 'Mode: Keep Winners Eligible'}
              </span>
            </span>
          </div>

          {onStartDraw && (
            <button
              type="button"
              disabled={!canStartDraw || stageState !== 'idle'}
              onClick={onStartDraw}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${stageState !== 'idle' ? 'animate-spin' : ''}`} />
              <span>
                {stageState !== 'idle'
                  ? `Selecting ${requestedCount} Player(s)...`
                  : `Launch Simultaneous Selection (${requestedCount} Player${
                      requestedCount > 1 ? 's' : ''
                    })`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
