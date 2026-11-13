import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { CheckCircle2, UserPlus } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#14B8A6', // Teal
];

export default function ParticipantFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.full_name || '');
    } else {
      setFullName('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Participant full name is required.');
      return;
    }

    const randomColor =
      initialData?.avatar_color ||
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    try {
      await onSubmit({
        full_name: fullName.trim(),
        email: initialData?.email || '',
        department: initialData?.department || 'General',
        avatar_color: randomColor,
        is_eligible: true,
      });
    } catch (err) {
      setError(err.message || 'Failed to save participant.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Participant Name' : 'Register New Participant'}
      subtitle={
        initialData
          ? 'Update the participant full name.'
          : 'Enter full name to immediately add as an eligible participant.'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Juan Dela Cruz"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Automatically set as Eligible for the next draw</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : initialData ? 'Save Name' : 'Add Participant'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
