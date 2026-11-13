import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FileImportModal({ isOpen, onClose, onImportFile }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setImportResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setImportResult(null);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleContent =
      'full_name,email,department\n' +
      'Elena Rostova,elena.rostova@pulsedraw.io,Engineering\n' +
      'Marcus Vance,marcus.vance@pulsedraw.io,Product Design\n' +
      'Sophia Chen,sophia.chen@pulsedraw.io,Data Science\n' +
      "Liam O'Connor,liam.oconnor@pulsedraw.io,Engineering\n" +
      'Amara Okafor,amara.okafor@pulsedraw.io,Marketing\n';

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pulsedraw_participants_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV or Excel (.xlsx) file first.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const result = await onImportFile(selectedFile);
      setImportResult(result);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message || 'Failed to import file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setImportResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Participants (CSV / Excel)"
      subtitle="Upload a .csv or .xlsx spreadsheet to batch-register participants."
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {importResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Import Complete</span>
            </div>
            <p className="text-xs text-slate-700">
              Added <strong>{importResult.created_count}</strong> new participant(s).
              {importResult.skipped_duplicates_count > 0 &&
                ` Skipped ${importResult.skipped_duplicates_count} duplicate name(s).`}
            </p>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-indigo-50/40 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          {selectedFile ? (
            <div>
              <p className="text-sm font-bold text-emerald-600">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag & drop your file here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports <strong>.CSV</strong> and <strong>.XLSX (Excel)</strong> files
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="text-slate-600">
            Columns supported: <code className="text-indigo-600 font-bold">full_name</code>,{' '}
            <code className="text-indigo-600 font-bold">email</code>,{' '}
            <code className="text-indigo-600 font-bold">department</code>
          </div>
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold shrink-0 ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template CSV</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Importing...' : 'Upload & Import'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
