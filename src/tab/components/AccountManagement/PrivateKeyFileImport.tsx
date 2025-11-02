/**
 * PrivateKeyFileImport - Private key file import component
 *
 * Allows users to import a Bitcoin account from encrypted (.enc) or plain text (.txt) files
 * containing WIF-format private keys. Supports drag-and-drop file upload.
 *
 * Features:
 * - Drag-and-drop file upload
 * - Encrypted .enc file support with password decryption
 * - Plain text .txt file support
 * - Real-time WIF validation using VALIDATE_WIF backend handler
 * - Network detection and validation (testnet vs mainnet)
 * - Address type selection (Legacy/SegWit/Native SegWit)
 * - Duplicate key detection
 * - Account name customization
 * - File format validation
 * - Security warnings
 *
 * Props:
 * - selectedFile: Currently selected file
 * - onFileSelect: File selection handler
 * - encryptedData: Parsed encrypted file data
 * - decryptPassword: Decryption password for encrypted files
 * - onDecryptPasswordChange: Decrypt password change handler
 * - onDecryptAndValidate: Decrypt and validate handler
 * - validationResult: WIF validation result from backend
 * - isValidating: Validation in progress
 * - accountName: Current account name value
 * - onAccountNameChange: Account name change handler
 * - addressType: Selected address type
 * - onAddressTypeChange: Address type change handler
 * - errors: Validation errors
 * - isSubmitting: Import in progress
 *
 * Usage:
 * <PrivateKeyFileImport
 *   selectedFile={file}
 *   onFileSelect={handleFileSelect}
 *   encryptedData={encData}
 *   decryptPassword={password}
 *   onDecryptPasswordChange={setPassword}
 *   onDecryptAndValidate={handleDecrypt}
 *   validationResult={result}
 *   isValidating={false}
 *   accountName={name}
 *   onAccountNameChange={setName}
 *   addressType={type}
 *   onAddressTypeChange={setType}
 *   errors={{}}
 *   isSubmitting={false}
 * />
 */

import React, { useRef, useState } from 'react';
import FormField from '../shared/FormField';
import { AddressType } from '../../../shared/types/index';
import { EncryptedKeyFile } from '../../utils/fileReader';

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: AddressType;
  compressed?: boolean;
  error?: string;
}

interface PrivateKeyFileImportProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  encryptedData: EncryptedKeyFile | null;
  decryptPassword: string;
  onDecryptPasswordChange: (value: string) => void;
  onDecryptAndValidate: () => void;
  validationResult: WIFValidationResult | null;
  isValidating: boolean;
  accountName: string;
  onAccountNameChange: (value: string) => void;
  addressType: AddressType;
  onAddressTypeChange: (value: AddressType) => void;
  errors: {
    file?: string;
    decryptPassword?: string;
    accountName?: string;
  };
  isSubmitting: boolean;
}

export const PrivateKeyFileImport: React.FC<PrivateKeyFileImportProps> = ({
  selectedFile,
  onFileSelect,
  encryptedData,
  decryptPassword,
  onDecryptPasswordChange,
  onDecryptAndValidate,
  validationResult,
  isValidating,
  accountName,
  onAccountNameChange,
  addressType,
  onAddressTypeChange,
  errors,
  isSubmitting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Character count color for account name
  const charCountColor =
    accountName.length > 30
      ? 'text-red-500'
      : accountName.length > 25
      ? 'text-amber-500'
      : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <FormField
        label="Import File"
        id="file-upload"
        error={errors.file}
        helperText="Encrypted .enc or plain text .txt files"
        required
      >
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-bitcoin bg-bitcoin-subtle'
              : errors.file
              ? 'border-red-500 bg-red-500/5'
              : 'border-gray-700 hover:border-gray-600 bg-gray-950'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".enc,.txt"
            onChange={handleFileInputChange}
            disabled={isSubmitting}
            className="hidden"
          />
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-500"
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
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-white mb-1">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              {encryptedData && (
                <span className="inline-block mt-2 px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded">
                  Encrypted File
                </span>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-gray-500">Accepts .enc (encrypted) or .txt (plain text) files</p>
            </div>
          )}
        </div>
      </FormField>

      {/* Decryption Password (for encrypted files) */}
      {encryptedData && !validationResult && (
        <div className="space-y-4">
          <FormField
            label="Decryption Password"
            id="decrypt-password"
            required
            error={errors.decryptPassword}
            helperText="Enter the password used to encrypt this private key"
          >
            <input
              type="password"
              id="decrypt-password"
              value={decryptPassword}
              onChange={(e) => onDecryptPasswordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && decryptPassword) {
                  onDecryptAndValidate();
                }
              }}
              disabled={isSubmitting}
              className={`w-full h-12 px-4 bg-gray-950 border ${
                errors.decryptPassword
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
              } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Enter decryption password"
              autoComplete="off"
            />
          </FormField>

          <button
            onClick={onDecryptAndValidate}
            disabled={!decryptPassword || isValidating || isSubmitting}
            className="w-full h-12 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                <span>Decrypting...</span>
              </div>
            ) : (
              'Decrypt and Validate'
            )}
          </button>
        </div>
      )}

      {/* Validation Result Preview */}
      {validationResult && validationResult.valid && (
        <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Preview</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Network:</span>
              <span className="text-sm font-medium text-white capitalize">
                {validationResult.network}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Key Type:</span>
              <span className="text-sm font-medium text-white">
                {validationResult.compressed ? 'Compressed' : 'Uncompressed'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-400">First Address:</span>
              <span className="text-xs font-mono text-gray-300 break-all text-right ml-4 max-w-[300px]">
                {validationResult.firstAddress}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Form (only show after validation) */}
      {validationResult && validationResult.valid && (
        <div className="space-y-6">
          {/* Account Name */}
          <FormField
            label="Account Name"
            id="file-account-name"
            required
            error={errors.accountName}
            helperText="Choose a name to identify this account"
          >
            <input
              type="text"
              id="file-account-name"
              value={accountName}
              onChange={(e) => onAccountNameChange(e.target.value)}
              disabled={isSubmitting}
              className={`w-full h-12 px-4 bg-gray-950 border ${
                errors.accountName
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
              } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="e.g., Imported Account 1"
              maxLength={50}
            />
          </FormField>

          {/* Character Counter */}
          <div className="flex justify-end -mt-4">
            <span className={`text-xs ${charCountColor}`}>{accountName.length}/30</span>
          </div>

          {/* Address Type Selection (only for compressed keys) */}
          {validationResult.compressed && (
            <FormField
              label="Address Type"
              id="file-address-type"
              required
              helperText="Choose the address format for this account"
            >
              <select
                id="file-address-type"
                value={addressType}
                onChange={(e) => onAddressTypeChange(e.target.value as AddressType)}
                disabled={isSubmitting}
                className="w-full h-12 px-4 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-bitcoin focus:ring-3 focus:ring-bitcoin/30 rounded-lg text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="legacy">Legacy (P2PKH) - Slower, higher fees</option>
                <option value="segwit">SegWit (P2SH-P2WPKH) - Moderate fees</option>
                <option value="native-segwit">
                  Native SegWit (P2WPKH) - Recommended, lowest fees
                </option>
              </select>
            </FormField>
          )}

          {/* Uncompressed key notice */}
          {!validationResult.compressed && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200">
                This is an uncompressed private key. Only Legacy (P2PKH) addresses are supported.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateKeyFileImport;
