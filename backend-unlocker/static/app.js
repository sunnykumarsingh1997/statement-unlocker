// Paperless Gateway - Frontend JavaScript

const API_BASE = '/api';

// State
let selectedFiles = [];
let passwords = [];

// DOM Elements
const passwordTextarea = document.getElementById('passwordTextarea');
const loadPasswordsBtn = document.getElementById('loadPasswordsBtn');
const savePasswordsBtn = document.getElementById('savePasswordsBtn');
const passwordStatus = document.getElementById('passwordStatus');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPasswords();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Password management
    loadPasswordsBtn.addEventListener('click', loadPasswords);
    savePasswordsBtn.addEventListener('click', savePasswords);

    // File upload
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Upload and clear
    uploadBtn.addEventListener('click', handleUpload);
    clearBtn.addEventListener('click', clearFiles);
}

// Password Management
async function loadPasswords() {
    try {
        const response = await fetch(`${API_BASE}/passwords`);
        const data = await response.json();
        passwords = data.passwords || [];
        passwordTextarea.value = passwords.join('\n');
        showStatus(passwordStatus, 'Passwords loaded successfully', 'success');
    } catch (error) {
        showStatus(passwordStatus, `Failed to load passwords: ${error.message}`, 'error');
    }
}

async function savePasswords() {
    const passwordText = passwordTextarea.value.trim();
    const passwordList = passwordText.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    try {
        const response = await fetch(`${API_BASE}/passwords`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passwords: passwordList }),
        });

        if (response.ok) {
            const data = await response.json();
            passwords = data.passwords || [];
            showStatus(passwordStatus, `Saved ${data.count} passwords`, 'success');
        } else {
            const error = await response.json();
            showStatus(passwordStatus, `Failed to save: ${error.detail || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        showStatus(passwordStatus, `Failed to save passwords: ${error.message}`, 'error');
    }
}

// File Handling
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length > 0) {
        addFiles(files);
    } else {
        alert('Please drop PDF files only');
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    files.forEach(file => {
        if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    updateFileList();
    updateUploadButton();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateUploadButton();
}

function updateFileList() {
    fileList.innerHTML = '';

    if (selectedFiles.length === 0) {
        clearBtn.disabled = true;
        return;
    }

    clearBtn.disabled = false;

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-item-info">
                <span class="file-item-name">${escapeHtml(file.name)}</span>
                <span class="file-item-size">(${formatFileSize(file.size)})</span>
            </div>
            <button class="file-item-remove" onclick="removeFile(${index})">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });
}

function updateUploadButton() {
    uploadBtn.disabled = selectedFiles.length === 0;
}

function clearFiles() {
    selectedFiles = [];
    fileInput.value = '';
    updateFileList();
    updateUploadButton();
    resultsSection.style.display = 'none';
    resultsContainer.innerHTML = '';
}

// Upload Processing
async function handleUpload() {
    if (selectedFiles.length === 0) {
        alert('Please select files to upload');
        return;
    }

    // Disable upload button and show loading
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Processing...';

    // Show results section
    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = '<p>Processing files...</p>';

    try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayResults(data.results);
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="result-item error">
                <div class="result-message">Error: ${escapeHtml(error.message)}</div>
            </div>
        `;
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Process & Upload Files';
    }
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results to display</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;

        const statusClass = result.success ? 'success' : (result.unlocked ? 'warning' : 'error');
        const statusText = result.success ? 'Success' : (result.unlocked ? 'Unlocked but Upload Failed' : 'Failed');

        let detailsHtml = '';
        if (result.metadata) {
            const meta = result.metadata;
            detailsHtml = `
                <div class="result-details">
                    <div><strong>Bank:</strong> ${escapeHtml(meta.bank_name || 'Unknown')}</div>
                    <div><strong>Owner:</strong> ${escapeHtml(meta.owner_name || 'Unknown')}</div>
                    <div><strong>Period:</strong> ${escapeHtml(meta.period || 'Unknown')}</div>
                    ${result.renamed_filename ? `<div><strong>Renamed to:</strong> ${escapeHtml(result.renamed_filename)}</div>` : ''}
                    ${result.unlocked !== undefined ? `<div><strong>Unlocked:</strong> ${result.unlocked ? 'Yes' : 'No'}</div>` : ''}
                </div>
            `;
        }

        resultItem.innerHTML = `
            <div class="result-header">
                <span class="result-filename">${escapeHtml(result.filename)}</span>
                <span class="result-status ${statusClass}">${statusText}</span>
            </div>
            <div class="result-message">${escapeHtml(result.message || 'No message')}</div>
            ${detailsHtml}
            ${result.error ? `<div class="result-details"><strong>Error:</strong> ${escapeHtml(result.error)}</div>` : ''}
        `;

        resultsContainer.appendChild(resultItem);
    });
}

// Utility Functions
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message show ${type}`;
    setTimeout(() => {
        element.className = 'status-message';
    }, 5000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make removeFile available globally for onclick handlers
window.removeFile = removeFile;

