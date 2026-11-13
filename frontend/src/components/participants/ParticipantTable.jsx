import React from 'react';
import { Edit2, Trash2, CheckCircle, XCircle, Trophy, Mail } from 'lucide-react';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ParticipantTable({
  participants,
  onToggleEligible,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-5">Participant</th>
              <th className="py-3.5 px-4">Department / Group</th>
              <th className="py-3.5 px-4">Eligibility Status</th>
              <th className="py-3.5 px-4 text-center">Times Selected</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {participants.map((p) => (
              <tr
                key={p.id}
                className={`group transition-colors ${
                  p.is_eligible ? 'hover:bg-slate-50/80' : 'bg-slate-50/50 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Participant Name & Avatar */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: p.avatar_color || '#6366F1' }}
                    >
                      {getInitials(p.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{p.full_name}</div>
                      {p.email ? (
                        <div className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{p.email}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Registered Player</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {p.department || 'General'}
                  </span>
                </td>

                {/* Eligibility Toggle */}
                <td className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => onToggleEligible(p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      p.is_eligible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Click to toggle eligibility for next draw"
                  >
                    {p.is_eligible ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Eligible</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Excluded (Selected)</span>
                      </>
                    )}
                  </button>
                </td>

                {/* Times Selected */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {p.times_selected}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit participant"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
