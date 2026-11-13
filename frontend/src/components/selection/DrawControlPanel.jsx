import React from 'react';
import {
  Sparkles,
  Users,
  UserCheck,
  UserMinus,
  RotateCcw,
  Plus,
  Minus,
  AlertTriangle,
  Tag,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';

const QUICK_COUNTS = [1, 2, 3, 4, 5, 6];

export default function DrawControlPanel({
  requestedCount,
  onChangeRequestedCount,
  excludeWinners,
  onChangeExcludeWinners,
  title,
  onChangeTitle,
  eligibleCount,
  totalCount,
  excludedCount,
  isRunning,
  onStartDraw,
  onResetEligibility,
  isFullscreen = false,
  onToggleFullscreen,
  soundEnabled = true,
  onToggleSound,
}) {
  const hasInsufficientEligible = requestedCount > eligibleCount;
  const canStartDraw =
    !isRunning && eligibleCount > 0 && requestedCount >= 1 && requestedCount <= eligibleCount;

  const handleAdjustCount = (delta) => {
    const next = Math.max(1, Number(requestedCount || 1) + delta);
    onChangeRequestedCount(next);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Row: Event Label & Pool Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        {/* Draw Title Input */}
        <div className="lg:col-span-4">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Activity / Round Label</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            disabled={isRunning}
            placeholder="e.g., Team Trivia Round 1"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white disabled:opacity-50"
          />
        </div>

        {/* Simultaneous Player Count Selector */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Number of Players to Draw Simultaneously
            </label>
            <span className="text-xs font-mono font-bold text-indigo-600">
              Max Available: <strong>{eligibleCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Preset Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {QUICK_COUNTS.map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isRunning}
                  onClick={() => onChangeRequestedCount(num)}
                  className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all ${
                    Number(requestedCount) === num
                      ? 'bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-sm'
                      : num > eligibleCount
                      ? 'text-slate-400 hover:text-slate-600'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Custom Stepper & Input */}
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 px-1.5 py-1">
              <button
                type="button"
                disabled={isRunning || requestedCount <= 1}
                onClick={() => handleAdjustCount(-1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30"
                aria-label="Decrease player count"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(1, totalCount)}
                value={requestedCount}
                disabled={isRunning}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeRequestedCount(Number.isNaN(val) ? 1 : Math.max(1, val));
                }}
                className="w-12 text-center bg-transparent font-mono text-sm font-extrabold text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                disabled={isRunning}
                onClick={() => handleAdjustCount(1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30"
                aria-label="Increase player count"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Eligibility Mode Toggle */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Post-Draw Eligibility Rule
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeExcludeWinners(true)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                excludeWinners
                  ? 'bg-white text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Selected participants are automatically excluded from subsequent draws until reset"
            >
              <UserMinus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Exclude Winners</span>
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeExcludeWinners(false)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                !excludeWinners
                  ? 'bg-white text-emerald-700 border border-emerald-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Selected participants remain eligible for future draws"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Keep Eligible</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Warning Banner when Eligible < Requested */}
      {hasInsufficientEligible && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Not Enough Eligible Participants for This Selection
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                You selected <strong>{requestedCount}</strong> player
                {requestedCount !== 1 ? 's' : ''}, but only <strong>{eligibleCount}</strong> out of{' '}
                <strong>{totalCount}</strong> registered participant
                {totalCount !== 1 ? 's' : ''} {eligibleCount === 1 ? 'is' : 'are'} currently eligible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {eligibleCount > 0 && (
              <button
                type="button"
                onClick={() => onChangeRequestedCount(eligibleCount)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
              >
                Set Count to {eligibleCount}
              </button>
            )}
            {excludedCount > 0 && (
              <button
                type="button"
                onClick={onResetEligibility}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Eligibility ({excludedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>
              Registered: <strong className="text-slate-900 font-mono">{totalCount}</strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Eligible Pool: <strong className="text-emerald-700 font-mono">{eligibleCount}</strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              Previously Selected: <strong className="text-amber-700 font-mono">{excludedCount}</strong>
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold border transition-colors ${
                soundEnabled
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Sound Effects On (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>SFX On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>Muted</span>
                </>
              )}
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
              title={isFullscreen ? 'Exit Full Screen Mode' : 'Enter Full Screen Draw Mode'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-indigo-600" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-indigo-600" />
                  <span>Full Screen Draw</span>
                </>
              )}
            </button>
          )}

          {excludedCount > 0 && (
            <button
              type="button"
              disabled={isRunning}
              onClick={onResetEligibility}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>Reset Pool</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canStartDraw}
            onClick={onStartDraw}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-extrabold tracking-wide text-white bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:via-cyan-500 hover:to-emerald-500 shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <Sparkles className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>
              {isRunning
                ? `Scanning Matrix for ${requestedCount} Player${requestedCount > 1 ? 's' : ''}...`
                : `Start Selection (${requestedCount} Player${requestedCount > 1 ? 's' : ''})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
