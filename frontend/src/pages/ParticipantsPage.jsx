import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Upload,
  Search,
  RotateCcw,
  Trash2,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react';
import ParticipantTable from '../components/participants/ParticipantTable';
import ParticipantFormModal from '../components/participants/ParticipantFormModal';
import FileImportModal from '../components/participants/FileImportModal';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  fetchParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  importParticipantsFile,
  bulkDeleteParticipants,
} from '../api/participantsApi';
import { usePulseDraw } from '../context/PulseDrawContext';

export default function ParticipantsPage() {
  const {
    poolStats,
    syncStatsFromResponse,
    handleResetEligibilityGlobal,
    handleSeedSamplesGlobal,
    addToast,
  } = usePulseDraw();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (eligibilityFilter !== 'all') params.is_eligible = eligibilityFilter;
      if (departmentFilter) params.department = departmentFilter;

      const data = await fetchParticipants(params);
      setParticipants(data.results || []);
      syncStatsFromResponse(data.stats);
    } catch (err) {
      addToast(err.message || 'Failed to load participants.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, eligibilityFilter, departmentFilter, syncStatsFromResponse, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadParticipants();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadParticipants]);

  const handleSaveParticipant = async (payload) => {
    setIsSubmittingForm(true);
    try {
      if (editingParticipant) {
        const res = await updateParticipant(editingParticipant.id, payload);
        syncStatsFromResponse(res.stats);
        addToast(`Updated "${res.participant.full_name}".`, 'success');
      } else {
        const res = await createParticipant(payload);
        syncStatsFromResponse(res.stats);
        addToast(`Registered "${res.participant.full_name}".`, 'success');
      }
      setIsFormModalOpen(false);
      setEditingParticipant(null);
      await loadParticipants();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleEligible = async (participant) => {
    try {
      const nextStatus = !participant.is_eligible;
      const res = await updateParticipant(participant.id, { is_eligible: nextStatus });
      syncStatsFromResponse(res.stats);
      setParticipants((prev) =>
        prev.map((item) => (item.id === participant.id ? res.participant : item))
      );
      addToast(
        `${participant.full_name} marked as ${nextStatus ? 'Eligible' : 'Excluded'}.`,
        'info'
      );
    } catch (err) {
      addToast(err.message || 'Failed to update eligibility.', 'error');
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteParticipant(participantToDelete.id);
      syncStatsFromResponse(res.stats);
      addToast(`Deleted "${participantToDelete.full_name}".`, 'success');
      setParticipantToDelete(null);
      await loadParticipants();
    } catch (err) {
      addToast(err.message || 'Failed to delete participant.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      const res = await bulkDeleteParticipants();
      syncStatsFromResponse(res.stats);
      addToast(res.message || 'All participants removed.', 'success');
      setIsClearAllOpen(false);
      await loadParticipants();
    } catch (err) {
      addToast(err.message || 'Failed to clear participants.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileImport = async (file) => {
    const res = await importParticipantsFile(file);
    syncStatsFromResponse(res.stats);
    addToast(res.message, 'success');
    await loadParticipants();
    return res;
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Participant Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register, edit, filter, or batch-import participants via CSV / Excel (.xlsx).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingParticipant(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Participant</span>
          </button>
        </div>
      </div>

      {/* Live Pool Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 font-bold">Total Registered</p>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-0.5">
              {poolStats.total_participants}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
            100% Roster
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 font-bold">Currently Eligible</p>
            <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-0.5">
              {poolStats.eligible_participants}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            Available for Draw
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 font-bold">Previously Selected (Excluded)</p>
            <p className="text-2xl font-extrabold font-mono text-amber-600 mt-0.5">
              {poolStats.excluded_participants}
            </p>
          </div>
          {poolStats.excluded_participants > 0 && (
            <button
              type="button"
              onClick={async () => {
                await handleResetEligibilityGlobal();
                loadParticipants();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter Tabs, and Bulk Utility Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Eligibility Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {[
              { key: 'all', label: `All (${poolStats.total_participants})` },
              { key: 'true', label: `Eligible (${poolStats.eligible_participants})` },
              { key: 'false', label: `Excluded (${poolStats.excluded_participants})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setEligibilityFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  eligibilityFilter === tab.key
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Department Dropdown */}
          {poolStats.departments?.length > 0 && (
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {poolStats.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear All Button */}
          {poolStats.total_participants > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Participant Table or Empty State */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading participant roster...</p>
        </div>
      ) : participants.length > 0 ? (
        <ParticipantTable
          participants={participants}
          onToggleEligible={handleToggleEligible}
          onEdit={(participant) => {
            setEditingParticipant(participant);
            setIsFormModalOpen(true);
          }}
          onDelete={(participant) => setParticipantToDelete(participant)}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Matching Participants Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {poolStats.total_participants === 0
                ? 'Your participant list is currently empty. Add participants manually, upload a CSV/Excel file, or load the 20 sample players.'
                : 'No participants match your current search or filter criteria.'}
            </p>
          </div>
          {poolStats.total_participants === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await handleSeedSamplesGlobal();
                  await loadParticipants();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 20 Sample Participants</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Participant Modal */}
      <ParticipantFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingParticipant(null);
        }}
        onSubmit={handleSaveParticipant}
        initialData={editingParticipant}
        isSubmitting={isSubmittingForm}
      />

      {/* CSV / Excel Import Modal */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportFile={handleFileImport}
      />

      {/* Delete Single Confirmation */}
      <ConfirmModal
        isOpen={Boolean(participantToDelete)}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="Delete Participant"
        message={
          participantToDelete
            ? `Are you sure you want to remove "${participantToDelete.full_name}" from the roster? Past draw history snapshots will still be preserved.`
            : ''
        }
        confirmText="Delete Participant"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Clear All Confirmation */}
      <ConfirmModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear Entire Participant Roster"
        message={`Are you sure you want to delete all ${poolStats.total_participants} registered participants? This cannot be undone.`}
        confirmText="Clear All Participants"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
