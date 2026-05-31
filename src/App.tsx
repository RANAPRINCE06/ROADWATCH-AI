/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
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
import { PriorityCenter } from './pages/PriorityCenter';
import { PredictiveAnalytics } from './pages/PredictiveAnalytics';
import { AICommandCenter } from './pages/AICommandCenter';
import { SensorNetwork } from './pages/SensorNetwork';
import { CitizenPortal } from './pages/CitizenPortal';
import { GovCommand } from './pages/GovCommand';
import { AccidentRisk } from './pages/AccidentRisk';
import { ReportsCenter } from './pages/ReportsCenter';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['authority']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/heatmap" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><LiveHeatmap /></Layout></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute allowedRoles={['authority', 'maintenance', 'citizen']}><Layout><ReportHazard /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['authority']}><Layout><Analytics /></Layout></ProtectedRoute>} />
        <Route path="/ai-reports" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><AIReportDetails /></Layout></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><EmergencyAlerts /></Layout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['authority']}><Layout><AdminPanel /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['authority']}><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/priority" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><PriorityCenter /></Layout></ProtectedRoute>} />
        <Route path="/predictive" element={<ProtectedRoute allowedRoles={['authority']}><Layout><PredictiveAnalytics /></Layout></ProtectedRoute>} />
        <Route path="/command-center" element={<ProtectedRoute allowedRoles={['authority', 'maintenance', 'citizen']}><Layout><AICommandCenter /></Layout></ProtectedRoute>} />
        <Route path="/sensors" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><SensorNetwork /></Layout></ProtectedRoute>} />
        <Route path="/citizen" element={<ProtectedRoute allowedRoles={['authority', 'citizen']}><Layout><CitizenPortal /></Layout></ProtectedRoute>} />
        <Route path="/gov-dashboard" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><GovCommand /></Layout></ProtectedRoute>} />
        <Route path="/accident-risk" element={<ProtectedRoute allowedRoles={['authority', 'maintenance']}><Layout><AccidentRisk /></Layout></ProtectedRoute>} />
        <Route path="/reports-center" element={<ProtectedRoute allowedRoles={['authority']}><Layout><ReportsCenter /></Layout></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

