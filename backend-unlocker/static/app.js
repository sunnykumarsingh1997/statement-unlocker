// Paperless Gateway - Frontend JavaScript

const API_BASE = '/api';

// State
let selectedFiles = [];
let clients = [];

// DOM Elements - will be initialized after DOM loads
let elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    setupEventListeners();
    loadPasswords();
    loadClients();
});

function initElements() {
    elements = {
        // Tabs
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Password
        passwordTextarea: document.getElementById('passwordTextarea'),
        loadPasswordsBtn: document.getElementById('loadPasswordsBtn'),
        savePasswordsBtn: document.getElementById('savePasswordsBtn'),
        passwordStatus: document.getElementById('passwordStatus'),
        
        // Upload
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        fileList: document.getElementById('fileList'),
        uploadBtn: document.getElementById('uploadBtn'),
        clearBtn: document.getElementById('clearBtn'),
        resultsSection: document.getElementById('resultsSection'),
        resultsContainer: document.getElementById('resultsContainer'),
        
        // Clients
        addClientBtn: document.getElementById('addClientBtn'),
        syncPaperlessBtn: document.getElementById('syncPaperlessBtn'),
        clientsTableBody: document.getElementById('clientsTableBody'),
        noClients: document.getElementById('noClients'),
        syncStatus: document.getElementById('syncStatus'),
        
        // Modal
        clientModal: document.getElementById('clientModal'),
        clientForm: document.getElementById('clientForm'),
        modalTitle: document.getElementById('modalTitle'),
        clientId: document.getElementById('clientId'),
        clientName: document.getElementById('clientName'),
        matchPattern: document.getElementById('matchPattern'),
        clientColor: document.getElementById('clientColor'),
        clientColorText: document.getElementById('clientColorText')
    };
}

function setupEventListeners() {
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Password management
    elements.loadPasswordsBtn.addEventListener('click', loadPasswords);
    elements.savePasswordsBtn.addEventListener('click', savePasswords);
    
    // File upload
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadBtn.addEventListener('click', handleUpload);
    elements.clearBtn.addEventListener('click', clearFiles);
    
    // Client management
    elements.addClientBtn.addEventListener('click', () => openClientModal());
    elements.syncPaperlessBtn.addEventListener('click', syncToPaperless);
    elements.clientForm.addEventListener('submit', handleClientSubmit);
    
    // Color picker sync
    elements.clientColor.addEventListener('input', (e) => {
        elements.clientColorText.value = e.target.value;
    });
    elements.clientColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            elements.clientColor.value = e.target.value;
        }
    });
    
    // Close modal on outside click
    elements.clientModal.addEventListener('click', (e) => {
        if (e.target === elements.clientModal) {
            closeClientModal();
        }
    });
}

// ========== Tab Switching ==========

function switchTab(tabId) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
}

// ========== Password Management ==========

async function loadPasswords() {
    try {
        const response = await fetch(`${API_BASE}/passwords`);
        const data = await response.json();
        elements.passwordTextarea.value = (data.passwords || []).join('\n');
        showStatus(elements.passwordStatus, `Loaded ${data.count} passwords`, 'success');
    } catch (error) {
        showStatus(elements.passwordStatus, `Failed to load passwords: ${error.message}`, 'error');
    }
}

async function savePasswords() {
    const passwordList = elements.passwordTextarea.value.trim()
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

    try {
        const response = await fetch(`${API_BASE}/passwords`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwords: passwordList }),
        });

        if (response.ok) {
            const data = await response.json();
            showStatus(elements.passwordStatus, `Saved ${data.count} passwords`, 'success');
        } else {
            const error = await response.json();
            showStatus(elements.passwordStatus, `Failed: ${error.detail}`, 'error');
        }
    } catch (error) {
        showStatus(elements.passwordStatus, `Failed: ${error.message}`, 'error');
    }
}

// ========== Client Management ==========

async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        const data = await response.json();
        clients = data.clients || [];
        renderClients();
    } catch (error) {
        console.error('Failed to load clients:', error);
    }
}

function renderClients() {
    const tbody = elements.clientsTableBody;
    tbody.innerHTML = '';
    
    if (clients.length === 0) {
        elements.noClients.classList.add('show');
        return;
    }
    
    elements.noClients.classList.remove('show');
    
    clients.forEach(client => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="color-swatch" style="background-color: ${escapeHtml(client.color)}"></span></td>
            <td>${escapeHtml(client.name)}</td>
            <td><code>${escapeHtml(client.match_pattern)}</code></td>
            <td><span class="synced-badge ${client.tag_id ? 'yes' : 'no'}">${client.tag_id ? 'Yes' : 'No'}</span></td>
            <td class="action-buttons">
                <button class="btn btn-secondary btn-small" onclick="editClient('${client.id}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openClientModal(clientId = null) {
    elements.clientForm.reset();
    elements.clientId.value = '';
    elements.clientColor.value = '#3b82f6';
    elements.clientColorText.value = '#3b82f6';
    
    if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            elements.modalTitle.textContent = 'Edit Client';
            elements.clientId.value = client.id;
            elements.clientName.value = client.name;
            elements.matchPattern.value = client.match_pattern;
            elements.clientColor.value = client.color;
            elements.clientColorText.value = client.color;
        }
    } else {
        elements.modalTitle.textContent = 'Add Client';
    }
    
    elements.clientModal.classList.add('show');
}

function closeClientModal() {
    elements.clientModal.classList.remove('show');
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientData = {
        name: elements.clientName.value.trim(),
        match_pattern: elements.matchPattern.value.trim(),
        color: elements.clientColor.value
    };
    
    const clientId = elements.clientId.value;
    
    try {
        let response;
        if (clientId) {
            // Update existing
            response = await fetch(`${API_BASE}/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });
        } else {
            // Create new
            response = await fetch(`${API_BASE}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });
        }
        
        if (response.ok) {
            closeClientModal();
            loadClients();
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/clients/${clientId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadClients();
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function syncToPaperless() {
    elements.syncPaperlessBtn.disabled = true;
    elements.syncPaperlessBtn.innerHTML = '<span class="spinner"></span> Syncing...';
    showStatus(elements.syncStatus, 'Syncing clients to Paperless...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/sync-paperless`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const successCount = data.results.filter(r => r.tag_created).length;
            showStatus(elements.syncStatus, `Sync complete! ${successCount}/${data.results.length} clients synced.`, 'success');
            loadClients(); // Refresh to show updated sync status
        } else {
            showStatus(elements.syncStatus, `Sync failed: ${data.detail}`, 'error');
        }
    } catch (error) {
        showStatus(elements.syncStatus, `Sync failed: ${error.message}`, 'error');
    } finally {
        elements.syncPaperlessBtn.disabled = false;
        elements.syncPaperlessBtn.innerHTML = '🔄 Sync to Paperless';
    }
}

// ========== File Upload ==========

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');

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
    addFiles(Array.from(e.target.files));
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
    elements.fileList.innerHTML = '';

    if (selectedFiles.length === 0) {
        elements.clearBtn.disabled = true;
        return;
    }

    elements.clearBtn.disabled = false;

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
        elements.fileList.appendChild(fileItem);
    });
}

function updateUploadButton() {
    elements.uploadBtn.disabled = selectedFiles.length === 0;
}

function clearFiles() {
    selectedFiles = [];
    elements.fileInput.value = '';
    updateFileList();
    updateUploadButton();
    elements.resultsSection.style.display = 'none';
    elements.resultsContainer.innerHTML = '';
}

async function handleUpload() {
    if (selectedFiles.length === 0) {
        alert('Please select files to upload');
        return;
    }

    elements.uploadBtn.disabled = true;
    elements.uploadBtn.innerHTML = '<span class="spinner"></span> Processing...';
    elements.resultsSection.style.display = 'block';
    elements.resultsContainer.innerHTML = '<p>Processing files...</p>';

    try {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

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
        elements.resultsContainer.innerHTML = `
            <div class="result-item error">
                <div class="result-message">Error: ${escapeHtml(error.message)}</div>
            </div>
        `;
    } finally {
        elements.uploadBtn.disabled = false;
        elements.uploadBtn.innerHTML = 'Process & Upload Files';
    }
}

function displayResults(results) {
    elements.resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        elements.resultsContainer.innerHTML = '<p>No results to display</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;

        const statusClass = result.success ? 'success' : (result.unlocked ? 'warning' : 'error');
        const statusText = result.success ? 'Success' : (result.unlocked ? 'Upload Failed' : 'Failed');

        let detailsHtml = '';
        if (result.metadata) {
            const meta = result.metadata;
            detailsHtml = `
                <div class="result-details">
                    <div><strong>Owner:</strong> ${escapeHtml(meta.owner_name || 'Unknown')}</div>
                    <div><strong>Period:</strong> ${escapeHtml(meta.period || 'Unknown')}</div>
                    ${meta.matched_client ? `<div><strong>Matched Client:</strong> ${escapeHtml(meta.matched_client)}</div>` : ''}
                    ${result.renamed_filename ? `<div><strong>Renamed to:</strong> ${escapeHtml(result.renamed_filename)}</div>` : ''}
                    ${result.tag_id ? `<div><strong>Tag ID:</strong> ${result.tag_id}</div>` : ''}
                    ${result.correspondent_id ? `<div><strong>Correspondent ID:</strong> ${result.correspondent_id}</div>` : ''}
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

        elements.resultsContainer.appendChild(resultItem);
    });
}

// ========== Utility Functions ==========

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message show ${type}`;
    if (type !== 'info') {
        setTimeout(() => {
            element.className = 'status-message';
        }, 5000);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for onclick handlers
window.removeFile = removeFile;
window.editClient = openClientModal;
window.deleteClient = deleteClient;
window.closeClientModal = closeClientModal;
