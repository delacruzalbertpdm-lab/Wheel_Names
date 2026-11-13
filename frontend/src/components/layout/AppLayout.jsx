import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  History,
  RotateCcw,
  Menu,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePulseDraw } from '../../context/PulseDrawContext';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & metrics',
  },
  {
    to: '/arena',
    label: 'Selection Arena',
    icon: Sparkles,
    description: 'Spotlight stage & draw',
    highlight: true,
  },
  {
    to: '/participants',
    label: 'Participants',
    icon: Users,
    description: 'Roster & CSV/Excel import',
  },
  {
    to: '/history',
    label: 'Draw History',
    icon: History,
    description: 'Past winners & audit log',
  },
];

export default function AppLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { poolStats, drawConfig, handleResetEligibilityGlobal } = usePulseDraw();
  const location = useLocation();
  const navigate = useNavigate();

  const eligibleRatio =
    poolStats.total_participants > 0
      ? Math.round((poolStats.eligible_participants / poolStats.total_participants) * 100)
      : 0;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (Clean White) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 shadow-sm">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 px-6 h-20 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">PulseDraw</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                CSPRNG
              </span>
            </div>
            <p className="text-xs text-slate-500">Simultaneous Selection System</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Control Center
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      item.highlight
                        ? 'text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <div>
                    <div className="leading-none font-bold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1 font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Live Pool Status Widget in Sidebar Footer */}
        <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Live Eligibility Pool</span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              {poolStats.eligible_participants} / {poolStats.total_participants}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${eligibleRatio}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{poolStats.excluded_participants} previously selected</span>
            {poolStats.excluded_participants > 0 && (
              <button
                onClick={handleResetEligibilityGlobal}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                title="Restore all participants to eligible status"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Python `secrets` CSPRNG</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-xs bg-white border-r border-slate-200 h-full flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="font-bold text-slate-900">PulseDraw</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Bar (Clean White) */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-600">
                Total: <strong className="text-slate-900">{poolStats.total_participants}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-emerald-700">
                Eligible: <strong>{poolStats.eligible_participants}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-mono text-indigo-700">
                Draw Size: <strong>{drawConfig.requestedCount}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {poolStats.excluded_participants > 0 && (
              <button
                onClick={handleResetEligibilityGlobal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reset Pool ({poolStats.excluded_participants} Excluded)</span>
              </button>
            )}

            {location.pathname !== '/arena' && (
              <button
                onClick={() => navigate('/arena')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Selection Arena</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
