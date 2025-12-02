import React, { useState, useEffect } from 'react';
import './PasswordManager.css';

const PasswordManager = ({ apiUrl }) => {
    const [passwords, setPasswords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Load passwords on mount
    useEffect(() => {
        loadPasswords();
    }, []);

    const loadPasswords = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/passwords`);
            const data = await response.json();
            setPasswords(data.passwords || []);
            setError(null);
        } catch (err) {
            setError('Failed to load passwords');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addPassword = async () => {
        if (!newPassword.trim()) {
            setError('Password cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/passwords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswords(data.passwords);
                setNewPassword('');
                setError(null);
            } else {
                setError(data.detail || 'Failed to add password');
            }
        } catch (err) {
            setError('Failed to add password');
            console.error(err);
        }
    };

    const updatePassword = async (index) => {
        if (!editValue.trim()) {
            setError('Password cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/passwords/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: editValue.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswords(data.passwords);
                setEditIndex(null);
                setEditValue('');
                setError(null);
            } else {
                setError(data.detail || 'Failed to update password');
            }
        } catch (err) {
            setError('Failed to update password');
            console.error(err);
        }
    };

    const deletePassword = async (index) => {
        if (!confirm('Are you sure you want to delete this password?')) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/passwords/${index}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setPasswords(data.passwords);
                setError(null);
            } else {
                setError(data.detail || 'Failed to delete password');
            }
        } catch (err) {
            setError('Failed to delete password');
            console.error(err);
        }
    };

    const startEdit = (index, password) => {
        setEditIndex(index);
        setEditValue(password);
    };

    const cancelEdit = () => {
        setEditIndex(null);
        setEditValue('');
    };

    if (loading) {
        return (
            <div className="password-manager loading">
                <div className="spinner-small"></div>
                <span>Loading passwords...</span>
            </div>
        );
    }

    return (
        <div className="password-manager">
            <div className="password-manager-header" onClick={() => setIsExpanded(!isExpanded)}>
                <h3>
                    🔑 Password Manager
                    <span className="password-count">({passwords.length} passwords)</span>
                </h3>
                <button className="expand-toggle">
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {isExpanded && (
                <div className="password-manager-content">
                    {error && (
                        <div className="password-error">
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button onClick={() => setError(null)} className="close-error">✕</button>
                        </div>
                    )}

                    {/* Add New Password */}
                    <div className="add-password-section">
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addPassword()}
                            placeholder="Enter new password..."
                            className="password-input"
                        />
                        <button onClick={addPassword} className="btn-add">
                            ➕ Add
                        </button>
                    </div>

                    {/* Password List */}
                    <div className="password-list">
                        {passwords.length === 0 ? (
                            <div className="empty-state">
                                <p>No passwords configured</p>
                                <p className="hint">Add passwords above to unlock PDFs</p>
                            </div>
                        ) : (
                            passwords.map((password, index) => (
                                <div key={index} className="password-item">
                                    {editIndex === index ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && updatePassword(index)}
                                                className="password-input-edit"
                                                autoFocus
                                            />
                                            <div className="password-actions">
                                                <button onClick={() => updatePassword(index)} className="btn-save">
                                                    💾
                                                </button>
                                                <button onClick={cancelEdit} className="btn-cancel">
                                                    ✕
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="password-value">{password}</span>
                                            <div className="password-actions">
                                                <button onClick={() => startEdit(index, password)} className="btn-edit">
                                                    ✏️
                                                </button>
                                                <button onClick={() => deletePassword(index)} className="btn-delete">
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="password-manager-footer">
                        <button onClick={loadPasswords} className="btn-refresh">
                            🔄 Refresh
                        </button>
                        <span className="footer-hint">Passwords are saved to passwords.txt</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordManager;
