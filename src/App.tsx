/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { LiveHeatmap } from './pages/LiveHeatmap';
import { ReportHazard } from './pages/ReportHazard';
import { Analytics } from './pages/Analytics';
import { AIReportDetails } from './pages/AIReportDetails';
import { EmergencyAlerts } from './pages/EmergencyAlerts';
import { AdminPanel } from './pages/AdminPanel';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/heatmap" element={<Layout><LiveHeatmap /></Layout>} />
        <Route path="/report" element={<Layout><ReportHazard /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/reports" element={<Layout><AIReportDetails /></Layout>} />
        <Route path="/alerts" element={<Layout><EmergencyAlerts /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

