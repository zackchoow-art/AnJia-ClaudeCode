import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import './index.css';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Contracts from './pages/Contracts';
import Approvals from './pages/Approvals';
import Budget from './pages/Budget';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';

ReactDOM.createRoot(document.getElementById('root')!)!.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="customers" element={<Customers />} />
          <Route path="sales" element={<Sales />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="budget" element={<Budget />} />
          <Route path="finance" element={<Finance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
