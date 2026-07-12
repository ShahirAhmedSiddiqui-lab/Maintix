import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Power, 
  LogOut, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Sparkles, 
  HelpCircle,
  Play,
  Check,
  User,
  ExternalLink,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { Asset, Issue, WorkOrder, Technician, ActivityLog } from '../types';
import QrScannerModal from './QrScannerModal';
import TechAssetHubModal from './TechAssetHubModal';

interface TechnicianDashboardProps {
  technicianId: string;
  assets: Asset[];
  issues: Issue[];
  workOrders: WorkOrder[];
  activityLogs: ActivityLog[];
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;
  onUpdateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  onReportIssue: (payload: Omit<Issue, 'id' | 'reportedDate'>) => Promise<void>;
  onLogout: () => void;
  isLoading?: boolean;
}

export default function TechnicianDashboard({
  technicianId,
  assets,
  issues,
  workOrders,
  activityLogs,
  onUpdateWorkOrder,
  onUpdateIssue,
  onUpdateTechnician,
  onReportIssue,
  onLogout,
  isLoading = false
}: TechnicianDashboardProps) {
  // Find current technician details
  const currentTech = technicians.find(t => t.id === technicianId) || {
    id: technicianId,
    name: "Technician User",
    specialty: "Industrial Specialist",
    status: "Available" as const,
    currentWorkload: 0,
    email: "tech@maintix.io",
    phone: "+1 (555) 000-0000"
  };

  const [activeTab, setActiveTab] = useState<'work-orders' | 'issues' | 'activity'>('work-orders');
  const [completingWOId, setCompletingWOId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);

  // QR Scanning States for Technician
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedAssetId, setScannedAssetId] = useState<string | null>(null);
  const [isHubOpen, setIsHubOpen] = useState(false);

  const handleQrScanSuccess = (assetId: string) => {
    setScannedAssetId(assetId);
    setIsHubOpen(true);
  };

  // Filter personal data
  const myWorkOrders = workOrders.filter(w => w.assignedTechnicianId === technicianId);
  const myIssues = issues.filter(i => i.assignedTechnicianId === technicianId);
  const myCompletedWorkOrders = myWorkOrders.filter(w => w.status === 'Completed');
  const myPendingWorkOrders = myWorkOrders.filter(w => w.status !== 'Completed');
  const myPendingIssues = myIssues.filter(i => i.status !== 'Resolved');

  // Compute status counts for KPIs
  const activeJobsCount = myPendingWorkOrders.length + myPendingIssues.length;
  const completedJobsCount = myCompletedWorkOrders.length;
  const unresolvedIssuesCount = myPendingIssues.length;

  const handleStatusChange = async (newStatus: 'Available' | 'On Job' | 'Offline') => {
    try {
      await onUpdateTechnician(technicianId, { status: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleStartWorkOrder = async (id: string) => {
    try {
      await onUpdateWorkOrder(id, { status: 'In Progress' });
    } catch (e) {
      console.error("Failed to start work order", e);
    }
  };

  const handleCompleteWorkOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingWOId) return;

    try {
      // Mark work order completed
      await onUpdateWorkOrder(completingWOId, { status: 'Completed' });
      
      // Auto-resolve corresponding issue if linked
      const currentWO = workOrders.find(w => w.id === completingWOId);
      if (currentWO) {
        const linkedIssue = issues.find(i => i.assetId === currentWO.assetId && i.status !== 'Resolved');
        if (linkedIssue) {
          await onUpdateIssue(linkedIssue.id, { status: 'Resolved' });
        }
      }

      setCompletingWOId(null);
      setResolutionNotes('');
    } catch (e) {
      console.error("Failed to complete work order", e);
    }
  };

  const handleResolveIssueDirectly = async (issueId: string) => {
    try {
      await onUpdateIssue(issueId, { status: 'Resolved' });
    } catch (e) {
      console.error("Failed to resolve issue", e);
    }
  };

  return (
    <div id="tech-viewport" className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100">
      
      {/* Mini-Sticky Top Header bar for Technician */}
      <header id="tech-header" className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-6 md:px-12 flex items-center justify-between">
        <div id="tech-brand-lead" className="flex items-center gap-3">
          <div id="tech-logo-container" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Wrench className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span id="tech-logo-title" className="font-display font-bold text-base text-gray-900 tracking-tight leading-none">Maintix</span>
            <span id="tech-logo-sub" className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">Technician Work Bench</span>
          </div>
        </div>

        {/* Quick status controls + Logout */}
        <div id="tech-user-actions" className="flex items-center gap-4">
          {/* Duty status pills selection */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs gap-1">
            <button
              id="status-btn-available"
              onClick={() => handleStatusChange('Available')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentTech.status === 'Available' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              Available
            </button>
            <button
              id="status-btn-onjob"
              onClick={() => handleStatusChange('On Job')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentTech.status === 'On Job' 
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-100' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
              On Job
            </button>
            <button
              id="status-btn-offline"
              onClick={() => handleStatusChange('Offline')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentTech.status === 'Offline' 
                  ? 'bg-white text-gray-700 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
              Offline
            </button>
          </div>

          <span className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Quick QR Code Scanner button */}
          <button
            id="btn-tech-scan-qr"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Asset QR</span>
          </button>

          {/* User Sign out */}
          <button
            id="btn-tech-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors hover:border-red-100 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <main id="tech-dashboard-container" className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Welcome Profile & Responsive Status Picker */}
        <section id="tech-hero" className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div id="tech-avatar-big" className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 font-bold font-display text-xl flex items-center justify-center border border-blue-200">
              {currentTech.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="tech-welcome-title" className="text-xl font-display font-semibold text-gray-900 tracking-tight">Welcome back, {currentTech.name}</h1>
                <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded-full ${
                  currentTech.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                  currentTech.status === 'On Job' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentTech.status}
                </span>
              </div>
              <p id="tech-specialty-sub" className="text-sm text-gray-500 font-medium mt-0.5">{currentTech.specialty}</p>
              <p id="tech-contact-sub" className="text-xs text-gray-400 mt-1">{currentTech.email} • {currentTech.phone}</p>
            </div>
          </div>

          {/* Quick duty switcher for mobile layout */}
          <div className="flex sm:hidden flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Update Duty Status</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleStatusChange('Available')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center ${currentTech.status === 'Available' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'}`}
              >
                Available
              </button>
              <button
                onClick={() => handleStatusChange('On Job')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center ${currentTech.status === 'On Job' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
              >
                On Job
              </button>
              <button
                onClick={() => handleStatusChange('Offline')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center ${currentTech.status === 'Offline' ? 'bg-gray-600 text-white' : 'bg-white text-gray-600'}`}
              >
                Offline
              </button>
            </div>
          </div>
        </section>

        {/* Tailored Metrics Cards Row (Linear Style) */}
        <section id="tech-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div id="kpi-tech-workload" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">My Queue</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-gray-900 tracking-tight">{activeJobsCount}</span>
              <span className="text-xs font-medium text-gray-400">active items</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{myPendingWorkOrders.length} work orders • {unresolvedIssuesCount} faults</p>
          </div>

          <div id="kpi-tech-completed" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Completed Jobs</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-gray-900 tracking-tight">{completedJobsCount}</span>
              <span className="text-xs font-medium text-gray-400">completed</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Historic cumulative task completions</p>
          </div>

          <div id="kpi-tech-efficiency" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Efficiency index</span>
              <Wrench className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-gray-900 tracking-tight">96.4%</span>
              <span className="text-xs font-medium text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded-lg">+1.2%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Average asset up-time after repair</p>
          </div>

          <div id="kpi-tech-load-score" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Workload Index</span>
              <Power className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-gray-900 tracking-tight">
                {currentTech.currentWorkload * 10} / 100
              </span>
              <span className="text-xs font-medium text-gray-400">Score</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Safety and dispatch capacity threshold</p>
          </div>
        </section>

        {/* Tab Selection Filter */}
        <div id="tech-tabs-rail" className="border-b border-gray-200 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              id="tab-btn-work-orders"
              onClick={() => setActiveTab('work-orders')}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'work-orders' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Assigned Work Orders ({myWorkOrders.length})</span>
            </button>
            <button
              id="tab-btn-issues"
              onClick={() => setActiveTab('issues')}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'issues' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Assigned Issues & AI Advice ({myIssues.length})</span>
            </button>
            <button
              id="tab-btn-activity"
              onClick={() => setActiveTab('activity')}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'activity' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Recent Activity Log</span>
            </button>
          </div>

          {isLoading && (
            <span className="text-xs text-blue-600 font-mono flex items-center gap-1.5 animate-pulse mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Syncing...
            </span>
          )}
        </div>

        {/* Dynamic Tab Contents */}
        <section id="tech-tab-content" className="space-y-4">
          
          {/* 1. Work Orders Tab */}
          {activeTab === 'work-orders' && (
            <div className="space-y-4">
              {myWorkOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">No work orders assigned to you</p>
                  <p className="text-xs text-gray-400 mt-1">You are clean of scheduled facility dispatches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myWorkOrders.map((wo) => {
                    const isCompleted = wo.status === 'Completed';
                    const isInProgress = wo.status === 'In Progress';
                    const isNew = wo.status === 'Scheduled' || wo.status === 'Assigned';

                    return (
                      <div 
                        id={`wo-card-${wo.id}`}
                        key={wo.id}
                        className={`bg-white border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                          isCompleted ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm hover:border-gray-300'
                        }`}
                      >
                        <div>
                          {/* Card Head */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono font-bold text-gray-400">{wo.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' :
                              isInProgress ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {wo.status}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold text-gray-900 leading-snug">{wo.title}</h3>
                          <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-gray-400" />
                            {wo.assetName}
                            <span className="text-gray-300">•</span>
                            <span className="font-mono text-gray-400">ID: {wo.assetId}</span>
                          </p>

                          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{wo.description}</p>
                          
                          {/* Metadata Block */}
                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>Due: {wo.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className={`w-3.5 h-3.5 ${
                                wo.priority === 'Critical' || wo.priority === 'High' ? 'text-red-500' : 'text-gray-400'
                              }`} />
                              <span>Priority: {wo.priority}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                          {isNew && (
                            <button
                              id={`wo-btn-start-${wo.id}`}
                              onClick={() => handleStartWorkOrder(wo.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start Work</span>
                            </button>
                          )}
                          {isInProgress && (
                            <button
                              id={`wo-btn-complete-${wo.id}`}
                              onClick={() => setCompletingWOId(wo.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          )}
                          {isCompleted && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold py-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Done ({wo.completedDate})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Issues & AI Triage Advice Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {myIssues.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">No tickets or faults assigned to you</p>
                  <p className="text-xs text-gray-400 mt-1">Excellent job! Your active dispatch roster is fully clear.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myIssues.map((issue) => {
                    const isResolved = issue.status === 'Resolved';
                    return (
                      <div 
                        id={`issue-card-${issue.id}`}
                        key={issue.id}
                        className={`bg-white border rounded-2xl p-6 transition-all ${
                          isResolved ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row gap-6 justify-between">
                          
                          {/* Issue Primary Description */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-gray-400">{issue.id}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                issue.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                issue.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {issue.priority} Priority
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {issue.status}
                              </span>
                            </div>

                            <h3 className="text-base font-semibold text-gray-900 leading-tight">{issue.title}</h3>
                            <p className="text-xs text-gray-500 font-semibold">
                              Reported by {issue.reportedBy} on {new Date(issue.reportedDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              {issue.description}
                            </p>

                            {!isResolved && (
                              <div className="pt-2">
                                <button
                                  id={`issue-btn-resolve-${issue.id}`}
                                  onClick={() => handleResolveIssueDirectly(issue.id)}
                                  className="flex items-center gap-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Mark Resolved</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* AI Triage Advice Panel */}
                          {issue.aiAnalysis && (
                            <div className="flex-1 bg-blue-50/50 border border-blue-100/60 rounded-2xl p-5 space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider font-mono text-blue-800">Gemini AI Triage Assistant</span>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Root Cause Possibilities</h4>
                                <ul className="mt-1.5 space-y-1">
                                  {issue.aiAnalysis.possibleCauses.map((cause, idx) => (
                                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                      <span className="text-blue-500 select-none mt-0.5">•</span>
                                      <span>{cause}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Diagnostic Checklist Procedures</h4>
                                <ul className="mt-1.5 space-y-1.5">
                                  {issue.aiAnalysis.initialChecks.map((check, idx) => (
                                    <li key={idx} className="text-xs text-gray-600 bg-white border border-blue-100/40 p-2 rounded-lg flex items-start gap-2">
                                      <span className="w-4 h-4 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span>{check}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Activity Logs Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Facility Status & Activity Log</h3>
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-gray-100 pl-1">
                {activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 z-10 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{log.message}</p>
                      <p className="text-xs text-gray-400">By {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Complete Work Order Modal */}
      {completingWOId && (
        <div id="complete-modal" className="fixed inset-0 bg-gray-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-gray-900 tracking-tight">Complete Work Order</h3>
              <button 
                onClick={() => setCompletingWOId(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-xs text-gray-400">Work order completion automatically sets the associated asset state back to Operational and logs this event in Maintix history.</p>

            <form onSubmit={handleCompleteWorkOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">Resolution Notes & Findings</label>
                <textarea
                  id="textarea-resolution-notes"
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the diagnostics performed, part replacements, or adjustments made..."
                  rows={4}
                  className="block w-full p-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompletingWOId(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
        assets={assets}
      />

      {/* Technician Asset Hub Modal */}
      {scannedAssetId && (
        <TechAssetHubModal
          isOpen={isHubOpen}
          onClose={() => {
            setIsHubOpen(false);
            setScannedAssetId(null);
          }}
          assetId={scannedAssetId}
          assets={assets}
          issues={issues}
          workOrders={workOrders}
          onReportIssue={onReportIssue}
        />
      )}

    </div>
  );
}

// Stub static mock of technicians matching server seed data
const technicians = [
  {
    id: "TECH-01",
    name: "Sarah Jenkins",
    specialty: "Electrical Systems Lead",
    status: "Available" as const,
    currentWorkload: 0,
    email: "s.jenkins@maintix.io",
    phone: "+1 (555) 382-9901"
  },
  {
    id: "TECH-02",
    name: "Carlos Ramirez",
    specialty: "Mechanical / Industrial Systems",
    status: "On Job" as const,
    currentWorkload: 1,
    email: "c.ramirez@maintix.io",
    phone: "+1 (555) 728-1120"
  },
  {
    id: "TECH-03",
    name: "David Chen",
    specialty: "Robotics / Automation Control",
    status: "Available" as const,
    currentWorkload: 0,
    email: "d.chen@maintix.io",
    phone: "+1 (555) 193-4422"
  },
  {
    id: "TECH-04",
    name: "Samantha Patel",
    specialty: "Heavy Machinery & Safety Specialist",
    status: "Offline" as const,
    currentWorkload: 0,
    email: "s.patel@maintix.io",
    phone: "+1 (555) 902-8811"
  }
];
