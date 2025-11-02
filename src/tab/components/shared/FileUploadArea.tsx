/**
 * FileUploadArea - Drag-and-drop file upload component
 *
 * Provides a visual drag-and-drop zone with browse button fallback.
 * Validates file type and size, shows selected file details.
 *
 * Features:
 * - Drag and drop support
 * - Browse button fallback
 * - File type validation
 * - File size validation
 * - Selected file display with remove option
 * - Error message display
 * - Keyboard accessible
 *
 * Props:
 * - onFileSelect: Callback when file is selected
 * - acceptedTypes: Array of accepted MIME types or extensions
 * - maxSizeMB: Maximum file size in megabytes
 * - className: Optional className for container
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadAreaProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  className?: string;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  acceptedTypes = ['.dat'],
  maxSizeMB = 10,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File too large (${sizeMB.toFixed(1)} MB). Maximum size: ${maxSizeMB} MB`;
    }

    // Check file type
    const hasValidExtension = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!hasValidExtension) {
      return `Invalid file type. Please select a ${acceptedTypes.join(' or ')} file.`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 min-h-[240px] flex flex-col items-center justify-center
            ${isDragging
              ? 'border-bitcoin bg-bitcoin/5 scale-[1.02]'
              : 'border-gray-700 hover:border-bitcoin hover:bg-bitcoin/5'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Select wallet backup file. Drag and drop or press Enter to browse files"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
          />

          <div className="text-6xl mb-4 text-gray-600">📁</div>
          <p className="text-base text-gray-400 mb-2">
            Drag & drop your {acceptedTypes.join(' or ')} file here
          </p>
          <p className="text-sm text-gray-500 mb-3">or</p>
          <button
            type="button"
            className="bg-gray-800 hover:bg-gray-750 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Supported: {acceptedTypes.join(', ')} files only<br />
            Max size: {maxSizeMB} MB
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <span className="text-bitcoin text-2xl flex-shrink-0">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)} • Selected {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="ml-3 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
            aria-label="Remove selected file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300 flex items-start">
            <span className="mr-2">❌</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
