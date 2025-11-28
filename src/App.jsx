import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EmailProvider } from './context/EmailContext';
import Layout from './components/Layout';
import InvoiceGenerator from './components/invoice/InvoiceGenerator';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-root">
        <Navigation />
        <Routes>
          <Route path="/" element={
            <EmailProvider>
              <Layout />
            </EmailProvider>
          } />
          <Route path="/invoice" element={<InvoiceGenerator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
