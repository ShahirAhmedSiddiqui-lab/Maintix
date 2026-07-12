import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import AssetsList from './components/AssetsList';
import IssuesList from './components/IssuesList';
import ScheduleList from './components/ScheduleList';
import TechniciansList from './components/TechniciansList';
import QrGenerator from './components/QrGenerator';
import Login from './components/Login';
import TechnicianDashboard from './components/TechnicianDashboard';
import QrScannerModal from './components/QrScannerModal';
import { Asset, Issue, WorkOrder, Technician, ActivityLog } from './types';
import { ShieldCheck, UserCheck, Wrench, Menu, X, ArrowUpRight, QrCode } from 'lucide-react';

export default function App() {
  // User Authentication State
  const [user, setUser] = useState<{ role: 'admin' | 'technician'; email: string; technicianId?: string } | null>(() => {
    const saved = localStorage.getItem('maintix_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Tab states: 'dashboard' | 'assets' | 'issues' | 'schedule' | 'technicians'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Telemetry status variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // QR Code Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannedAssetId, setScannedAssetId] = useState<string | null>(null);

  const handleScanSuccess = (assetId: string) => {
    setScannedAssetId(assetId);
    setActiveTab('assets');
  };

  // Fetch all database tables from Express Server
  const fetchAllData = async () => {
    try {
      const [assetsRes, issuesRes, techniciansRes, woRes, activityRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/issues'),
        fetch('/api/technicians'),
        fetch('/api/workorders'),
        fetch('/api/activity')
      ]);

      const [assetsData, issuesData, techniciansData, woData, activityData] = await Promise.all([
        assetsRes.json(),
        issuesRes.json(),
        techniciansRes.json(),
        woRes.json(),
        activityRes.json()
      ]);

      setAssets(assetsData);
      setIssues(issuesData);
      setTechnicians(techniciansData);
      setWorkOrders(woData);
      setActivityLogs(activityData);
    } catch (err) {
      console.error("Critical error loading system tables:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // API Mutation Handlers

  // 1. Add Asset
  const handleAddAsset = async (newAssetPayload: Omit<Asset, 'id' | 'maintenanceCount'>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssetPayload)
      });
      if (!response.ok) throw new Error("Failed to add asset on server.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Report Issue (AI Triage)
  const handleReportIssue = async (newIssuePayload: Omit<Issue, 'id' | 'reportedDate'>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssuePayload)
      });
      if (!response.ok) throw new Error("Failed to log ticket on server.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Update Issue (Assigned Tech or Resolution)
  const handleUpdateIssue = async (id: string, updates: Partial<Issue>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to dispatch technicians.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Create Work Order
  const handleAddWorkOrder = async (newWOPayload: Omit<WorkOrder, 'id'>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWOPayload)
      });
      if (!response.ok) throw new Error("Failed to schedule work order.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Update Work Order (Technician, status completed/in progress)
  const handleUpdateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/workorders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update schedule metrics.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Update Technician status
  const handleUpdateTechnician = async (id: string, updates: Partial<Technician>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/technicians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update technician duty.");
      await fetchAllData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Router dispatcher
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Overview
            assets={assets}
            issues={issues}
            workOrders={workOrders}
            activityLogs={activityLogs}
            technicians={technicians}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'assets':
        return (
          <AssetsList
            assets={assets}
            onAddAsset={handleAddAsset}
            isLoading={isSubmitting}
            defaultSelectedId={scannedAssetId}
            onClearDefaultSelection={() => setScannedAssetId(null)}
          />
        );
      case 'issues':
        return (
          <IssuesList
            issues={issues}
            assets={assets}
            technicians={technicians}
            onReportIssue={handleReportIssue}
            onUpdateIssue={handleUpdateIssue}
            isLoading={isSubmitting}
          />
        );
      case 'schedule':
        return (
          <ScheduleList
            workOrders={workOrders}
            assets={assets}
            technicians={technicians}
            onAddWorkOrder={handleAddWorkOrder}
            onUpdateWorkOrder={handleUpdateWorkOrder}
            isLoading={isSubmitting}
          />
        );
      case 'technicians':
        return (
          <TechniciansList
            technicians={technicians}
            workOrders={workOrders}
            issues={issues}
            onUpdateTechnician={handleUpdateTechnician}
            isLoading={isSubmitting}
          />
        );
      case 'qr':
        return (
          <QrGenerator assets={assets} />
        );
      default:
        return <div className="text-gray-500">Feature under construction.</div>;
    }
  };

  // Active Issue indicator count for Sidebar
  const activeIssuesCount = issues.filter(i => i.status !== 'Resolved').length;

  const handleLogin = (role: 'admin' | 'technician', email: string, techId?: string) => {
    const session = { role, email, technicianId: techId };
    setUser(session);
    localStorage.setItem('maintix_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('maintix_session');
  };

  if (isLoading) {
    return (
      <div id="maintix-loader" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div id="loader-spinner" className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <h2 id="loader-title" className="text-base font-display font-semibold text-gray-900 mt-4">Initializing Maintix System</h2>
        <p id="loader-desc" className="text-xs text-gray-400 mt-1">Establishing full-stack enterprise data connection...</p>
      </div>
    );
  }

  // 1. Unauthenticated (Show Login Screen)
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Technician View (Tailored Technician Workbench)
  if (user.role === 'technician') {
    return (
      <TechnicianDashboard
        technicianId={user.technicianId || 'TECH-01'}
        assets={assets}
        issues={issues}
        workOrders={workOrders}
        activityLogs={activityLogs}
        onUpdateWorkOrder={handleUpdateWorkOrder}
        onUpdateIssue={handleUpdateIssue}
        onUpdateTechnician={handleUpdateTechnician}
        onReportIssue={handleReportIssue}
        onLogout={handleLogout}
        isLoading={isSubmitting}
      />
    );
  }

  // 3. Admin View (Facility Operations Control Panel)
  return (
    <div id="maintix-app-root" className="min-h-screen bg-gray-50 flex font-sans">
      {/* Permanent Side Navigation */}
      <Sidebar 
        currentTab={activeTab} 
        setTab={setActiveTab} 
        issuesCount={activeIssuesCount} 
        onLogout={handleLogout} 
      />

      {/* Main View Port Container */}
      <div id="viewport-main" className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Bar */}
        <header id="viewport-header" className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          {/* Breadcrumb path */}
          <div id="header-breadcrumbs" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <span>Maintix Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-bold capitalize">{activeTab === 'schedule' ? 'Work Orders' : activeTab}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Stats Summary Rail (Atlassian / GitHub style) */}
            <div id="header-stats-rail" className="hidden lg:flex items-center gap-6 text-xs text-gray-500 border-l border-gray-100 pl-6">
              <div id="stat-nodes-operational" className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>{assets.filter(a => a.status === 'Operational').length} Operational</span>
              </div>
              <div id="stat-nodes-dispatched" className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>{workOrders.filter(w => w.status === 'In Progress').length} Active Dispatches</span>
              </div>
              <div id="stat-nodes-faults" className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-red-600">{issues.filter(i => i.status !== 'Resolved').length} Unresolved Faults</span>
              </div>
            </div>

            {/* Quick QR Code Scanner Entry */}
            <div className="pl-4 border-l border-gray-100 flex items-center">
              <button
                id="btn-scan-qr-header"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 rounded-lg transition-all shadow-2xs hover:border-gray-300 pointer-events-auto cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-gray-500" />
                <span>Scan Asset QR</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Client Body Canvas */}
        <main id="viewport-canvas" className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Global QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        assets={assets}
      />
    </div>
  );
}
