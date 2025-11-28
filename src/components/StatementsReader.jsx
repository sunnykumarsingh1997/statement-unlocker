import React, { useState } from 'react';
import { GeminiService } from '../services/GeminiService';
import './StatementsReader.css';

const StatementsReader = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            // Simulate AI processing
            const result = await GeminiService.parseStatement(file);
            setTransactions(result.transactions);
            setSummary(result.summary);
        } catch (error) {
            console.error("Error parsing statement:", error);
            alert("Failed to parse statement. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionChange = (id, field, value) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const exportToCSV = () => {
        if (transactions.length === 0) return;

        const headers = ["Date", "Merchant", "Amount", "Category", "Notes"];
        const csvContent = [
            headers.join(","),
            ...transactions.map(t =>
                [t.date, t.merchant, t.amount, t.category, t.notes].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "transactions.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="statements-reader-container">
            <div className="hero-section">
                <h1>AI Statements Reader</h1>
                <p>Upload your credit card statement (PDF) to automatically extract and categorize transactions.</p>
            </div>

            <div className="upload-section">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="file-input"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="upload-button"
                >
                    {loading ? "Processing..." : "Analyze Statement"}
                </button>
            </div>

            {loading && (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>AI is analyzing your statement...</p>
                </div>
            )}

            {summary && (
                <div className="summary-section">
                    <div className="summary-card">
                        <h3>Total Spend</h3>
                        <p className="amount">${summary.totalSpend}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Top Category</h3>
                        <p>{summary.topCategory}</p>
                    </div>
                </div>
            )}

            {transactions.length > 0 && (
                <div className="results-section">
                    <div className="actions-bar">
                        <h2>Transactions</h2>
                        <button onClick={exportToCSV} className="export-button">Export to CSV</button>
                    </div>

                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Merchant</th>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <input
                                            value={t.date}
                                            onChange={(e) => handleTransactionChange(t.id, 'date', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={t.merchant}
                                            onChange={(e) => handleTransactionChange(t.id, 'merchant', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={t.amount}
                                            onChange={(e) => handleTransactionChange(t.id, 'amount', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={t.category}
                                            onChange={(e) => handleTransactionChange(t.id, 'category', e.target.value)}
                                        >
                                            <option value="Travel">Travel</option>
                                            <option value="Office">Office</option>
                                            <option value="Meals">Meals</option>
                                            <option value="Software">Software</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            value={t.notes}
                                            onChange={(e) => handleTransactionChange(t.id, 'notes', e.target.value)}
                                            placeholder="Add notes..."
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StatementsReader;
