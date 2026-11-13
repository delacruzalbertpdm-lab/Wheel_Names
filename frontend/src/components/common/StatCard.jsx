import React from 'react';

const COLOR_STYLES = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    glow: 'from-indigo-50/70 to-transparent',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    glow: 'from-emerald-50/70 to-transparent',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    glow: 'from-amber-50/70 to-transparent',
  },
  cyan: {
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    glow: 'from-cyan-50/70 to-transparent',
  },
};

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'indigo', badge }) {
  const theme = COLOR_STYLES[color] || COLOR_STYLES.indigo;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2.5 mt-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {value}
            </span>
            {badge && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
