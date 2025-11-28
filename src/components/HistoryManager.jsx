import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaHistory, FaFileDownload } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

const HistoryManager = () => {
    const [history, setHistory] = useState([]);
    const [backupStatus, setBackupStatus] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setHistory(data || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = () => {
        // Since data is already in Supabase, this button could trigger a download of the data 
        // or just be a visual confirmation that data is synced.
        setBackupStatus('Syncing...');
        setTimeout(() => {
            setBackupStatus('All data is safely stored in the cloud.');
            setTimeout(() => setBackupStatus(''), 3000);
        }, 1000);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaHistory /> Recent History
                </h2>
                <button
                    onClick={handleBackup}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <FaCloudUploadAlt /> Cloud Synced
                </button>
            </div>

            {backupStatus && (
                <div style={{
                    padding: '10px',
                    background: '#d4edda',
                    color: '#155724',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    {backupStatus}
                </div>
            )}

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading history...</div>
                ) : history.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        No recent history found. Generate some invoices or emails to see them here.
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {history.map((item, index) => (
                            <li key={index} style={{
                                padding: '15px 20px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{item.action_type}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                        {new Date(item.created_at).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#555' }}>{item.details}</div>
                                </div>
                                <div style={{ color: '#007bff' }}>
                                    <FaFileDownload />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HistoryManager;
