import React, { useState, useCallback } from 'react';
import './BankStatementUnlocker.css';
import PasswordManager from './PasswordManager';

const BankStatementUnlocker = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState(null);

  const API_URL = 'http://localhost:8001';
  const PAPERLESS_URL = 'http://84.247.136.87:8000';

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
      e.target.value = ''; // Reset input to allow same file again
    }
  };

  const handleFilesAdded = (newFiles) => {
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
    const nonPdfCount = newFiles.length - pdfFiles.length;

    if (nonPdfCount > 0) {
      setError(`${nonPdfCount} non-PDF file(s) skipped. Only PDFs are supported.`);
    }

    if (pdfFiles.length > 0) {
      setFiles(prev => [...prev, ...pdfFiles]);
      setError(null);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setResults([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentlyProcessing(file.name);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(`${API_URL}/unlock`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setResults(prev => [...prev, {
          type: data.success ? 'success' : 'error',
          message: data.message,
          filename: data.filename,
          originalFilename: file.name,
          metadata: data.metadata || null,
        }]);
      } catch (err) {
        console.error('Upload error:', err);
        setResults(prev => [...prev, {
          type: 'error',
          message: `Upload failed: ${err.message}`,
          originalFilename: file.name,
          filename: file.name,
        }]);
      }
    }

    setUploading(false);
    setCurrentlyProcessing(null);
    setFiles([]);
  };

  const resetForm = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    setCurrentlyProcessing(null);
  };

  return (
    <div className="bank-statement-unlocker">
      <div className="unlocker-container">
        <div className="unlocker-header">
          <h1>🔓 Bank Statement Unlocker</h1>
          <p className="subtitle">
            Unlock password-protected bank statements and automatically upload to Paperless-ngx
          </p>
        </div>

        <div className="unlocker-content">
          {/* Password Manager */}
          <PasswordManager apiUrl={API_URL} />

          {/* Upload Area */}
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {files.length === 0 ? (
              <>
                <div className="upload-icon">📄</div>
                <h3>Drop PDFs here</h3>
                <p>or click to browse (multiple files supported)</p>
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <label htmlFor="file-input" className="upload-button">
                  Choose Files
                </label>
              </>
            ) : (
              <div className="files-list">
                <h4>{files.length} file{files.length > 1 ? 's' : ''} selected</h4>
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-icon">📎</div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="remove-file-button" disabled={uploading}>
                      ✕
                    </button>
                  </div>
                ))}
                <label htmlFor="file-input" className="add-more-button">
                  ➕ Add More Files
                </label>
              </div>
            )}
          </div>

          {/* Action Button */}
          {files.length > 0 && results.length === 0 && (
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className={`unlock-button ${uploading ? 'uploading' : ''}`}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  {currentlyProcessing ? `Processing: ${currentlyProcessing}...` : 'Processing...'}
                </>
              ) : (
                `🔓 Unlock & Upload ${files.length} File${files.length > 1 ? 's' : ''}`
              )}
            </button>
          )}

          {/* Results Display */}
          {results.length > 0 && (results.map((result, index) => (
            <div className={`result-card ${result.type}`}>
              <div className="result-icon">
                {result.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="result-content">
                <h3>{result.type === 'success' ? 'Success!' : 'Failed'}</h3>
                <p>{result.message}</p>
                {result.filename && (
                  <p className="result-filename">File: {result.filename}</p>
                )}
                {result.metadata && (
                  <div className="metadata-display">
                    <div className="metadata-item">
                      <span className="metadata-icon">👤</span>
                      <span className="metadata-label">Owner:</span>
                      <span className="metadata-value">{result.metadata.owner_name}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-icon">🏦</span>
                      <span className="metadata-label">Bank:</span>
                      <span className="metadata-value">{result.metadata.bank_name}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-icon">📅</span>
                      <span className="metadata-label">Period:</span>
                      <span className="metadata-value">{result.metadata.period}</span>
                    </div>
                    {result.metadata.account_last4 && (
                      <div className="metadata-item">
                        <span className="metadata-icon">🔢</span>
                        <span className="metadata-label">Account:</span>
                        <span className="metadata-value">****{result.metadata.account_last4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )))}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Clear Results Button */}
          {results.length > 0 && (
            <button onClick={resetForm} className="clear-results-button">
              ✓ Upload More Files
            </button>
          )}

          {/* Info Section */}
          <div className="info-section">
            <h3>ℹ️ How it works</h3>
            <ol>
              <li><strong>Manage Passwords:</strong> Click "Password Manager" above to add/edit/delete passwords</li>
              <li><strong>Upload PDFs:</strong> Drag & drop or select multiple password-protected bank statements</li>
              <li><strong>Auto-Unlock:</strong> System tries each password from your list until it finds the right one</li>
              <li><strong>Extract Metadata:</strong> Automatically reads owner name, bank, billing period from PDF</li>
              <li><strong>Smart Naming:</strong> Renames files as <code>BankName_OwnerName_Period.pdf</code></li>
              <li><strong>Upload to Paperless:</strong> Sends organized documents to your Paperless-ngx server</li>
              <li><strong>Results:</strong> See success/failure status with extracted metadata for each file</li>
            </ol>
            <div className="paperless-link">
              <strong>📄 Your Paperless-ngx:</strong>
              <a href={PAPERLESS_URL} target="_blank" rel="noopener noreferrer">
                {PAPERLESS_URL}
              </a>
            </div>
            <div className="security-note">
              <strong>🔒 Security:</strong> Files processed in-memory only. Never saved to disk. Supports batch uploads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankStatementUnlocker;
