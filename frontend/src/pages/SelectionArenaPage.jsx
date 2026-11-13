import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  Sparkles,
  Minimize2,
  RotateCcw,
  Plus,
  Minus,
  Zap,
  UserMinus,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import DrawControlPanel from '../components/selection/DrawControlPanel';
import SpotlightMatrix from '../components/selection/SpotlightMatrix';
import WinnerRevealStage from '../components/selection/WinnerRevealStage';
import { fetchParticipants } from '../api/participantsApi';
import { executeRandomDraw } from '../api/drawsApi';
import { usePulseDraw } from '../context/PulseDrawContext';
import {
  initYouTubeChoosingSound,
  startYouTubeChoosingSound,
  stopYouTubeChoosingSound,
  playScanTick,
  playTargetLockSound,
  playWinnerRevealFanfare,
} from '../utils/soundEffects';

const QUICK_COUNTS = [1, 2, 3, 4, 5, 6];

export default function SelectionArenaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    poolStats,
    drawConfig,
    setDrawConfig,
    syncStatsFromResponse,
    handleResetEligibilityGlobal,
    handleSeedSamplesGlobal,
    addToast,
  } = usePulseDraw();

  const [participants, setParticipants] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);

  // Fullscreen presentation state & Sound Effects state
  const [isFullscreen, setIsFullscreen] = useState(() => searchParams.get('fullscreen') === '1');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const stageContainerRef = useRef(null);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      if (!next) {
        stopYouTubeChoosingSound();
      }
      return next;
    });
  }, []);

  // Stage states: 'idle' | 'scanning' | 'locked' | 'revealed'
  const [stageState, setStageState] = useState('idle');
  const [activeSpotlightIds, setActiveSpotlightIds] = useState([]);
  const [lockedWinnerIds, setLockedWinnerIds] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentDrawResult, setCurrentDrawResult] = useState(null);

  const timersRef = useRef([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    initYouTubeChoosingSound('wKw0pvc1HiE');
    return () => {
      clearAllTimers();
      stopYouTubeChoosingSound();
    };
  }, [clearAllTimers]);

  // Sync native browser Fullscreen API with our full-viewport presentation mode
  const handleToggleFullscreen = useCallback(async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (nextState) {
      setSearchParams({ fullscreen: '1' }, { replace: true });
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback overlay still works even if browser blocks native fullscreen
      }
    } else {
      setSearchParams({}, { replace: true });
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  }, [isFullscreen, setSearchParams]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        setSearchParams({}, { replace: true });
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setSearchParams({}, { replace: true });
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, setSearchParams]);

  const loadParticipantsPool = useCallback(async () => {
    setLoadingPool(true);
    try {
      const data = await fetchParticipants();
      setParticipants(data.results || []);
      syncStatsFromResponse(data.stats);
    } catch (err) {
      addToast(err.message || 'Failed to load participant pool.', 'error');
    } finally {
      setLoadingPool(false);
    }
  }, [syncStatsFromResponse, addToast]);

  useEffect(() => {
    loadParticipantsPool();
  }, [loadParticipantsPool]);

  const eligibleParticipants = participants.filter((p) => p.is_eligible);
  const isRunning = stageState === 'scanning' || stageState === 'locked';
  const canStartDraw =
    !isRunning &&
    poolStats.eligible_participants > 0 &&
    drawConfig.requestedCount >= 1 &&
    drawConfig.requestedCount <= poolStats.eligible_participants;

  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B'],
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  };

  const handleStartSelection = async () => {
    if (isRunning) return;

    const requested = Number(drawConfig.requestedCount);
    if (requested < 1) {
      addToast('Please select at least 1 player for the draw.', 'warning');
      return;
    }

    if (eligibleParticipants.length < requested) {
      addToast(
        `Not enough eligible participants! Requested ${requested}, but only ${eligibleParticipants.length} available.`,
        'warning'
      );
      return;
    }

    clearAllTimers();
    setCurrentDrawResult(null);
    setLockedWinnerIds([]);
    setScanProgress(5);
    setStageState('scanning');

    // Start playing https://www.youtube.com/watch?v=wKw0pvc1HiE immediately on user click
    let ytStarted = false;
    if (soundEnabledRef.current) {
      ytStarted = startYouTubeChoosingSound();
    }

    const idempotencyKey = `draw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // 1. Request cryptographic random selection from the Django backend
    let backendResponse;
    try {
      backendResponse = await executeRandomDraw({
        requestedCount: requested,
        excludeWinners: drawConfig.excludeWinners,
        title: drawConfig.title,
        idempotencyKey,
      });
    } catch (err) {
      setStageState('idle');
      setScanProgress(0);
      setActiveSpotlightIds([]);
      stopYouTubeChoosingSound();
      addToast(err.message || 'Draw execution failed.', 'error');
      return;
    }

    const drawSession = backendResponse.draw;
    const winnerIds = (drawSession.winners || []).map((w) => w.participant_id);
    const eligibleIds = eligibleParticipants.map((p) => p.id);

    // 2. Choreograph the Spotlight Matrix scan synced to the YouTube choosing audio (~4.5s scan + lock + reveal)
    const totalSteps = 32;
    const stepDurationMs = 140;

    if (soundEnabledRef.current && !ytStarted) {
      playScanTick(1, totalSteps);
    }

    for (let step = 1; step <= totalSteps; step++) {
      const timerId = setTimeout(() => {
        setScanProgress(Math.round((step / totalSteps) * 100));
        const shuffled = [...eligibleIds].sort(() => 0.5 - Math.random());
        setActiveSpotlightIds(shuffled.slice(0, Math.min(requested, eligibleIds.length)));
        if (soundEnabledRef.current && !ytStarted) {
          playScanTick(step, totalSteps);
        }
      }, step * stepDurationMs);
      timersRef.current.push(timerId);
    }

    // 3. Target Lock-On Phase
    const lockTimeMs = (totalSteps + 1) * stepDurationMs;
    const lockTimer = setTimeout(() => {
      setActiveSpotlightIds([]);
      setLockedWinnerIds(winnerIds);
      setScanProgress(100);
      setStageState('locked');
      if (soundEnabledRef.current) {
        playTargetLockSound();
      }
    }, lockTimeMs);
    timersRef.current.push(lockTimer);

    // 4. Simultaneous Winner Cards Reveal Phase (synced with "MAY NANALO NA!" climax)
    const revealTimeMs = lockTimeMs + 900;
    const revealTimer = setTimeout(() => {
      setCurrentDrawResult(drawSession);
      setStageState('revealed');
      syncStatsFromResponse(backendResponse.stats);
      if (soundEnabledRef.current) {
        playWinnerRevealFanfare();
      }
      triggerCelebrationConfetti();
      fetchParticipants()
        .then((res) => {
          setParticipants(res.results || []);
          syncStatsFromResponse(res.stats);
        })
        .catch(() => {});
    }, revealTimeMs);
    timersRef.current.push(revealTimer);
  };

  const handleResetPoolFromStage = async () => {
    await handleResetEligibilityGlobal();
    await loadParticipantsPool();
  };

  const renderStageBody = () => {
    if (loadingPool) {
      return (
        <div className="flex-1 flex items-center justify-center rounded-3xl bg-white border border-slate-200 p-16 text-center shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              Initializing Digital Spotlight Matrix...
            </p>
          </div>
        </div>
      );
    }

    if (stageState === 'revealed' && currentDrawResult) {
      return (
        <WinnerRevealStage
          drawResult={currentDrawResult}
          eligibleRemaining={poolStats.eligible_participants}
          excludedCount={poolStats.excluded_participants}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onReturnToMatrix={() => setStageState('idle')}
          onResetEligibility={handleResetPoolFromStage}
          onDrawAgain={() => {
            if (poolStats.eligible_participants >= drawConfig.requestedCount) {
              handleStartSelection();
            } else {
              setStageState('idle');
            }
          }}
        />
      );
    }

    if (eligibleParticipants.length > 0) {
      return (
        <SpotlightMatrix
          eligibleParticipants={eligibleParticipants}
          stageState={stageState}
          activeSpotlightIds={activeSpotlightIds}
          lockedWinnerIds={lockedWinnerIds}
          scanProgress={scanProgress}
          requestedCount={drawConfig.requestedCount}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onStartDraw={handleStartSelection}
          canStartDraw={canStartDraw}
          excludeWinners={drawConfig.excludeWinners}
          totalCount={poolStats.total_participants}
        />
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-200 p-12 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">
          {poolStats.total_participants > 0
            ? 'All Participants Have Been Selected!'
            : 'No Participants Registered Yet'}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {poolStats.total_participants > 0
            ? `All ${poolStats.total_participants} registered participants are currently marked as excluded from previous draws. Reset participant eligibility to start a fresh round.`
            : 'Add participants manually, import a CSV/Excel file, or load the 20 sample participants to experience the simultaneous Spotlight Matrix.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          {poolStats.total_participants > 0 ? (
            <button
              type="button"
              onClick={handleResetPoolFromStage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reset All Eligibility ({poolStats.total_participants} Players)</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={async () => {
                  await handleSeedSamplesGlobal();
                  await loadParticipantsPool();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load 20 Sample Participants</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/participants')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Go to Participant Management</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Dedicated Full-Screen Presentation Mode for Drawing the Number of Players
  if (isFullscreen) {
    return (
      <div
        ref={stageContainerRef}
        className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col"
      >
        {/* Full-Screen Top Command Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 shadow-sm">
          <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Brand & Pool Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900">
                    PulseDraw Full-Screen Stage
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-xs font-bold text-emerald-700">
                    {poolStats.eligible_participants} / {poolStats.total_participants} Eligible
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Player Count Selector right in Full Screen */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Draw Players:</span>
                <div className="flex items-center gap-1">
                  {QUICK_COUNTS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isRunning}
                      onClick={() =>
                        setDrawConfig((prev) => ({ ...prev, requestedCount: num }))
                      }
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-extrabold transition-all ${
                        Number(drawConfig.requestedCount) === num
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Stepper */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 px-1 ml-1">
                  <button
                    type="button"
                    disabled={isRunning || drawConfig.requestedCount <= 1}
                    onClick={() =>
                      setDrawConfig((prev) => ({
                        ...prev,
                        requestedCount: Math.max(1, Number(prev.requestedCount || 1) - 1),
                      }))
                    }
                    className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, poolStats.total_participants)}
                    value={drawConfig.requestedCount}
                    disabled={isRunning}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDrawConfig((prev) => ({
                        ...prev,
                        requestedCount: Number.isNaN(val) ? 1 : Math.max(1, val),
                      }));
                    }}
                    className="w-10 text-center font-mono text-xs font-extrabold text-slate-900 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() =>
                      setDrawConfig((prev) => ({
                        ...prev,
                        requestedCount: Number(prev.requestedCount || 1) + 1,
                      }))
                    }
                    className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Exclude vs Keep Eligible Quick Toggle */}
              <button
                type="button"
                disabled={isRunning}
                onClick={() =>
                  setDrawConfig((prev) => ({
                    ...prev,
                    excludeWinners: !prev.excludeWinners,
                  }))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  drawConfig.excludeWinners
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {drawConfig.excludeWinners ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Auto-Exclude Winners</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Keep Winners Eligible</span>
                  </>
                )}
              </button>

              {poolStats.excluded_participants > 0 && (
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleResetPoolFromStage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reset ({poolStats.excluded_participants})</span>
                </button>
              )}

              {/* Sound Toggle Button in Full Screen */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  soundEnabled
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
                title={soundEnabled ? 'Sound Effects On (Click to Mute)' : 'Sound Effects Muted'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>SFX On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span>Muted</span>
                  </>
                )}
              </button>

              {/* Primary Start Selection Button */}
              <button
                type="button"
                disabled={!canStartDraw}
                onClick={handleStartSelection}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all"
              >
                <Sparkles className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                <span>
                  {isRunning
                    ? 'Scanning...'
                    : `Start Selection (${drawConfig.requestedCount})`}
                </span>
              </button>

              {/* Exit Full Screen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                title="Exit Full Screen (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit Full Screen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-Screen Stage Body (Fills remaining height cleanly) */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 max-w-[1680px] w-full mx-auto overflow-hidden">
          {renderStageBody()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Deck */}
      <DrawControlPanel
        requestedCount={drawConfig.requestedCount}
        onChangeRequestedCount={(count) =>
          setDrawConfig((prev) => ({ ...prev, requestedCount: count }))
        }
        excludeWinners={drawConfig.excludeWinners}
        onChangeExcludeWinners={(val) =>
          setDrawConfig((prev) => ({ ...prev, excludeWinners: val }))
        }
        title={drawConfig.title}
        onChangeTitle={(val) => setDrawConfig((prev) => ({ ...prev, title: val }))}
        eligibleCount={poolStats.eligible_participants}
        totalCount={poolStats.total_participants}
        excludedCount={poolStats.excluded_participants}
        isRunning={isRunning}
        onStartDraw={handleStartSelection}
        onResetEligibility={handleResetPoolFromStage}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Selection Stage */}
      {renderStageBody()}
    </div>
  );
}
