/**
 * CSVImportModal - Multi-step wizard for importing contacts from CSV
 *
 * A 4-step wizard modal for importing contacts:
 * 1. File Upload - Select CSV file
 * 2. Preview & Validation - Review contacts and configure import options
 * 3. Import Progress - Show importing spinner
 * 4. Results - Display import results with errors if any
 *
 * Features:
 * - CSV file validation (size, format)
 * - Preview first 10 rows before import
 * - Import options (skip duplicates, overwrite existing)
 * - Detailed error reporting
 * - Error report download
 *
 * Props:
 * - isOpen: Controls modal visibility
 * - onClose: Callback when modal closes
 * - onImportComplete: Callback with import results
 *
 * Usage:
 * <CSVImportModal
 *   isOpen={showImportModal}
 *   onClose={() => setShowImportModal(false)}
 *   onImportComplete={(result) => console.log('Imported:', result)}
 * />
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ImportResult, ImportError, MessageType } from '../../../shared/types';
import {
  readCSVFile,
  parseCSVPreview,
  countCSVRows,
  validateCSVFile,
  downloadFile,
} from '../../utils/csvHelpers';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Step state
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // CSV data state
  const [csvData, setCsvData] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [totalRows, setTotalRows] = useState(0);

  // Validation state
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import options state
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Show error details toggle
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset to initial state when opening
      setCurrentStep('upload');
      setSelectedFile(null);
      setFileError(null);
      setCsvData('');
      setPreviewRows([]);
      setTotalRows(0);
      setValidationResult(null);
      setIsValidating(false);
      setValidationError(null);
      setSkipDuplicates(true);
      setOverwriteExisting(false);
      setIsImporting(false);
      setImportResult(null);
      setImportError(null);
      setShowErrorDetails(false);
    }
  }, [isOpen]);

  // Step 1: Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file
    const error = validateCSVFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Handle next from upload step
  const handleNextFromUpload = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      // Read file content
      const content = await readCSVFile(selectedFile);
      setCsvData(content);

      // Parse preview
      const preview = parseCSVPreview(content);
      setPreviewRows(preview);

      // Count total rows
      const total = countCSVRows(content);
      setTotalRows(total);

      // Run validation (dry-run mode)
      const response = await sendMessage<{ result: ImportResult }>(
        MessageType.IMPORT_CONTACTS_CSV,
        {
          csvData: content,
          options: {
            skipDuplicates,
            overwriteExisting,
            validateOnly: true, // Dry-run mode
          },
        }
      );

      setValidationResult(response.result);
      setCurrentStep('preview');
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Failed to read or validate CSV file'
      );
    } finally {
      setIsValidating(false);
    }
  };

  // Handle back from preview step
  const handleBackFromPreview = () => {
    setCurrentStep('upload');
  };

  // Handle import from preview step
  const handleImport = async () => {
    if (!csvData) return;

    setCurrentStep('importing');
    setIsImporting(true);
    setImportError(null);

    try {
      // Run actual import
      const response = await sendMessage<{ result: ImportResult }>(
        MessageType.IMPORT_CONTACTS_CSV,
        {
          csvData,
          options: {
            skipDuplicates,
            overwriteExisting,
            validateOnly: false, // Real import
          },
        }
      );

      setImportResult(response.result);
      setCurrentStep('results');
      onImportComplete(response.result);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Failed to import contacts'
      );
      setCurrentStep('preview'); // Go back to preview on error
    } finally {
      setIsImporting(false);
    }
  };

  // Handle download error report
  const handleDownloadErrorReport = () => {
    if (!importResult || !importResult.errors.length) return;

    const csvHeader = 'Line,Name,Address,Error Reason\n';
    const csvRows = importResult.errors
      .map(
        (err) =>
          `${err.line},"${err.name.replace(/"/g, '""')}","${err.address.replace(
            /"/g,
            '""'
          )}","${err.reason.replace(/"/g, '""')}"`
      )
      .join('\n');

    const csvContent = csvHeader + csvRows;
    const filename = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;

    downloadFile(csvContent, filename);
  };

  // Handle close modal
  const handleClose = () => {
    // Don't allow closing during import
    if (currentStep === 'importing') return;
    onClose();
  };

  // Get step number for progress indicator
  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'upload':
        return 1;
      case 'preview':
        return 2;
      case 'importing':
        return 3;
      case 'results':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={currentStep !== 'importing'}
    >
      <div className="p-6 w-[550px] max-w-full max-h-[80vh] overflow-y-auto">
        {/* Header with Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Import Contacts from CSV</h2>
            <div className="text-sm text-gray-400">
              Step {getStepNumber()} of 4
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-bitcoin h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getStepNumber() / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: File Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
              Select a CSV file containing contacts to import. The file should include columns for name, address, category, and notes.
            </p>

            {/* File input */}
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <input
                type="file"
                id="csv-file-input"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-500 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-white font-semibold mb-1">
                  {selectedFile ? selectedFile.name : 'Choose CSV file'}
                </span>
                <span className="text-sm text-gray-500">
                  or drag and drop (max 1MB)
                </span>
              </label>
            </div>

            {/* File error */}
            {fileError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{fileError}</p>
              </div>
            )}

            {/* Validation error */}
            {validationError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{validationError}</p>
              </div>
            )}

            {/* CSV format guide */}
            <div className="mt-6 p-4 bg-gray-850 border border-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-2">CSV Format</h3>
              <p className="text-xs text-gray-400 mb-2">
                Your CSV file should have the following columns:
              </p>
              <code className="text-xs text-green-400 block bg-gray-900 p-2 rounded mb-3">
                Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
              </code>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Tags column:</span> Base64-encoded JSON object (optional)
                </p>
                <p className="text-xs text-gray-500 ml-2">
                  Tags are automatically encoded/decoded during export/import
                </p>
                <p className="text-xs text-gray-500 ml-2">
                  Leave empty if not needed
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNextFromUpload}
                disabled={!selectedFile || isValidating}
                className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Validation */}
        {currentStep === 'preview' && validationResult && (
          <div className="space-y-4">
            {/* Validation summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold">
                  {validationResult.imported + validationResult.skipped} valid contacts found
                </span>
              </div>

              {validationResult.skipped > 0 && (
                <div className="flex items-center gap-2 text-amber-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm">
                    {validationResult.skipped} duplicate{validationResult.skipped !== 1 ? 's' : ''} will be skipped
                  </span>
                </div>
              )}

              {validationResult.failed > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">
                    {validationResult.failed} invalid contact{validationResult.failed !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Error list (if any) */}
            {validationResult.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-gray-850 border border-gray-700 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-400 mb-2">Validation Errors:</p>
                <div className="space-y-1">
                  {validationResult.errors.slice(0, 5).map((err, index) => (
                    <p key={index} className="text-xs text-gray-400">
                      Line {err.line}: {err.name} - {err.reason}
                    </p>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <p className="text-xs text-gray-500 italic">
                      ...and {validationResult.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                Preview (First {previewRows.length} of {totalRows} rows)
              </h3>
              <div className="max-h-48 overflow-auto bg-gray-850 border border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-gray-400 font-semibold">Name</th>
                      <th className="px-2 py-2 text-left text-gray-400 font-semibold">Address</th>
                      <th className="px-2 py-2 text-left text-gray-400 font-semibold">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="px-2 py-2 text-white">{row.name}</td>
                        <td className="px-2 py-2 text-gray-400 font-mono text-[10px]">
                          {row.address.substring(0, 12)}...
                        </td>
                        <td className="px-2 py-2 text-gray-400">{row.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import options */}
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-white mb-2">Import Options</h3>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm text-white">Skip duplicate contacts</span>
                  <p className="text-xs text-gray-500">
                    Contacts with same name or address will be skipped
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm text-white">Overwrite existing contacts</span>
                  <p className="text-xs text-gray-500">
                    Update existing contacts if name matches
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBackFromPreview}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validationResult.imported + validationResult.skipped === 0}
                className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Import {validationResult.imported + validationResult.skipped} Contact
                {validationResult.imported + validationResult.skipped !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Import Progress */}
        {currentStep === 'importing' && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mx-auto mb-4"></div>
            <p className="text-white font-semibold">Importing contacts...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment</p>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && importResult && (
          <div className="space-y-4">
            {/* Success summary */}
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Import Complete!</h3>
            </div>

            {/* Results breakdown */}
            <div className="space-y-2 bg-gray-850 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Successfully imported:</span>
                <span className="text-green-400 font-semibold">{importResult.imported}</span>
              </div>
              {importResult.skipped > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Skipped (duplicates):</span>
                  <span className="text-amber-400 font-semibold">{importResult.skipped}</span>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Failed (invalid):</span>
                  <span className="text-red-400 font-semibold">{importResult.failed}</span>
                </div>
              )}
            </div>

            {/* Error details (expandable) */}
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="flex items-center justify-between w-full px-4 py-2 bg-gray-850 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-800 transition-colors"
                >
                  <span>View Error Details ({importResult.errors.length})</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showErrorDetails && (
                  <div className="max-h-48 overflow-y-auto bg-gray-850 border border-gray-700 rounded-lg p-3">
                    <div className="space-y-2">
                      {importResult.errors.map((err, index) => (
                        <div key={index} className="text-xs border-b border-gray-700 pb-2 last:border-0">
                          <p className="text-red-400 font-semibold">Line {err.line}: {err.name}</p>
                          <p className="text-gray-400 font-mono">{err.address}</p>
                          <p className="text-gray-500">{err.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download error report button */}
                <button
                  onClick={handleDownloadErrorReport}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Error Report
                </button>
              </div>
            )}

            {/* Import error */}
            {importError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{importError}</p>
              </div>
            )}

            {/* Done button */}
            <div className="mt-6">
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CSVImportModal;
