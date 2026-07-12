import React, { useState } from 'react';
import { Asset, Issue, Technician } from '../types';
import { Search, Sparkles, SlidersHorizontal, ChevronRight, X, AlertTriangle, Check, UserPlus, Clock, Hammer, ShieldAlert, BadgeInfo } from 'lucide-react';

interface IssuesListProps {
  issues: Issue[];
  assets: Asset[];
  technicians: Technician[];
  onReportIssue: (issue: Omit<Issue, 'id' | 'reportedDate'>) => Promise<void>;
  onUpdateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  isLoading: boolean;
}

export default function IssuesList({ issues, assets, technicians, onReportIssue, onUpdateIssue, isLoading }: IssuesListProps) {
  // Tabs for the view: 'list' (main tickets list) or 'triage' (AI Triage portal)
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'triage'>('list');

  // Directory filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Selected issue for the drawer
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // AI Triage portal state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageProgressText, setTriageProgressText] = useState('');
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [reporterName, setReporterName] = useState('Marcus Vance (Dock Lead)');

  // Form edit fields after triage
  const [triageTitle, setTriageTitle] = useState('');
  const [triageCategory, setTriageCategory] = useState('');
  const [triagePriority, setTriagePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  // Filters for Directory
  const categories = ['All', 'HVAC / Cooling', 'Manufacturing / Robotics', 'Electrical Systems', 'Fleet / Vehicles', 'Mechanical', 'Plumbing', 'IT Infrastructure'];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];
  const statuses = ['All', 'New', 'Triaged', 'In Progress', 'Resolved'];

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || issue.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // Run AI Triage handler
  const handleAiTriage = async () => {
    if (!selectedAssetId || !faultDescription.trim()) {
      alert("Please select the affected asset and enter a brief fault description.");
      return;
    }

    setTriageLoading(true);
    setAiResult(null);

    const asset = assets.find(a => a.id === selectedAssetId);
    
    // Smooth progress sequence for ultimate SaaS fidelity
    const steps = [
      "Initializing Gemini-3.5 cognitive processor...",
      "Matching fault signatures to local asset catalog...",
      "Analyzing potential environmental and downtime impacts...",
      "Formulating root cause scenarios and technician checklist...",
      "Finalizing structured engineering payload..."
    ];

    let stepIdx = 0;
    setTriageProgressText(steps[0]);
    const interval = setInterval(() => {
      stepIdx += 1;
      if (stepIdx < steps.length) {
        setTriageProgressText(steps[stepIdx]);
      }
    }, 1200);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: faultDescription,
          assetContext: asset ? {
            name: asset.name,
            category: asset.category,
            model: asset.model,
            location: asset.location,
            criticality: asset.criticality
          } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact triage server.");
      }

      const result = await response.json();
      setAiResult(result);
      
      // Auto-fill editable form fields
      setTriageTitle(result.title);
      setTriageCategory(result.category);
      setTriagePriority(result.priority);

    } catch (err: any) {
      alert(err.message || "An error occurred during AI analysis. Is the Gemini API Key configured in Secrets?");
    } finally {
      clearInterval(interval);
      setTriageLoading(false);
    }
  };

  // Submit AI triaged ticket to the database
  const handleLogTriagedTicket = async () => {
    if (!selectedAssetId || !aiResult) return;
    const asset = assets.find(a => a.id === selectedAssetId);

    const ticketPayload = {
      title: triageTitle || aiResult.title,
      description: faultDescription,
      assetId: selectedAssetId,
      assetName: asset ? asset.name : "Unknown Asset",
      category: triageCategory || aiResult.category,
      priority: triagePriority || aiResult.priority,
      status: "Triaged" as const,
      reportedBy: reporterName,
      aiAnalysis: {
        title: triageTitle || aiResult.title,
        category: triageCategory || aiResult.category,
        priority: triagePriority || aiResult.priority,
        possibleCauses: aiResult.possibleCauses,
        initialChecks: aiResult.initialChecks
      }
    };

    try {
      await onReportIssue(ticketPayload);
      // Reset triage portal state
      setFaultDescription('');
      setSelectedAssetId('');
      setAiResult(null);
      // Switch back to list view
      setActiveSubTab('list');
    } catch (err: any) {
      alert(err.message || "Failed to report issue.");
    }
  };

  // Assign Technician to issue in the detail panel
  const handleAssignTechnician = async (techId: string) => {
    if (!selectedIssue) return;
    try {
      await onUpdateIssue(selectedIssue.id, { assignedTechnicianId: techId });
      // Update selected issue state locally to reflect live changes
      const updatedIssue = { ...selectedIssue };
      const tech = technicians.find(t => t.id === techId);
      if (tech) {
        updatedIssue.assignedTechnicianId = tech.id;
        updatedIssue.assignedTechnicianName = tech.name;
        updatedIssue.status = "In Progress";
      } else {
        updatedIssue.assignedTechnicianId = undefined;
        updatedIssue.assignedTechnicianName = undefined;
      }
      setSelectedIssue(updatedIssue);
    } catch (err: any) {
      alert(err.message || "Failed to assign technician.");
    }
  };

  // Resolve Ticket handler
  const handleResolveTicket = async () => {
    if (!selectedIssue) return;
    try {
      await onUpdateIssue(selectedIssue.id, { status: "Resolved" });
      setSelectedIssue({ ...selectedIssue, status: "Resolved" });
    } catch (err: any) {
      alert(err.message || "Failed to resolve ticket.");
    }
  };

  return (
    <div id="issues-hub-container" className="space-y-6 animate-fade-in">
      {/* Header and Toggle Navigation */}
      <div id="issues-hub-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div id="issues-title-block">
          <h1 id="issues-main-heading" className="font-display font-bold text-3xl text-gray-900 tracking-tight">Issues & AI Triage</h1>
          <p id="issues-subheading" className="text-gray-500 text-sm mt-1">SaaS tickets directory with instant, automated machine learning diagnosis.</p>
        </div>
        
        {/* Sub-tab Toggle */}
        <div id="subtab-toggle-bar" className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200/55">
          <button
            id="tab-view-list"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeSubTab === 'list'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Active Tickets
          </button>
          <button
            id="tab-view-triage"
            onClick={() => setActiveSubTab('triage')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'triage'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Triage Portal
          </button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        /* ================= TICKET LIST VIEW ================= */
        <div id="ticket-list-body" className="space-y-6">
          {/* Filter Bar */}
          <div id="ticket-filter-bar" className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col gap-4 lg:flex-row lg:items-center justify-between shadow-xs">
            <div id="ticket-search-box" className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="ticket-search-input"
                type="text"
                placeholder="Search tickets, assets, reported by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>

            <div id="ticket-filters-group" className="flex flex-wrap items-center gap-3">
              <div id="filter-lbl" className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
              </div>

              {/* Category */}
              <select
                id="ticket-cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Departments' : c}</option>
                ))}
              </select>

              {/* Priority */}
              <select
                id="ticket-priority-filter"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>
                ))}
              </select>

              {/* Status */}
              <select
                id="ticket-status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Split View */}
          <div id="ticket-split-view" className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Table Area */}
            <div id="tickets-table-container" className="flex-1 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden w-full">
              <div id="tickets-table-scroll" className="overflow-x-auto">
                <table id="tickets-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">ID</th>
                      <th className="p-4">Subject Fault</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assigned Engineer</th>
                      <th className="p-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No logged tickets found matching these parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => {
                        const isSelected = selectedIssue?.id === issue.id;
                        return (
                          <tr
                            id={`ticket-row-${issue.id}`}
                            key={issue.id}
                            onClick={() => setSelectedIssue(issue)}
                            className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600' : ''
                            }`}
                          >
                            <td id={`td-issue-id-${issue.id}`} className="p-4 font-mono text-xs font-semibold text-blue-600">{issue.id}</td>
                            <td id={`td-issue-details-${issue.id}`} className="p-4">
                              <div id={`issue-desc-box-${issue.id}`} className="flex flex-col max-w-sm">
                                <span id={`issue-title-${issue.id}`} className="font-semibold text-gray-900 truncate">{issue.title}</span>
                                <span id={`issue-asset-name-${issue.id}`} className="text-xs text-gray-400 font-medium mt-0.5 truncate">{issue.assetName}</span>
                              </div>
                            </td>
                            <td id={`td-issue-cat-${issue.id}`} className="p-4 text-xs font-medium text-gray-500">{issue.category}</td>
                            <td id={`td-issue-priority-${issue.id}`} className="p-4">
                              <span id={`priority-pill-${issue.id}`} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${
                                issue.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                issue.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                issue.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {issue.priority}
                              </span>
                            </td>
                            <td id={`td-issue-status-${issue.id}`} className="p-4 text-xs">
                              <span id={`status-pill-${issue.id}`} className={`px-2 py-0.5 rounded-full font-semibold border ${
                                issue.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                issue.status === 'Triaged' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td id={`td-issue-tech-${issue.id}`} className="p-4 text-xs text-gray-600">
                              {issue.assignedTechnicianName ? (
                                <div id={`tech-assigned-${issue.id}`} className="flex items-center gap-1.5">
                                  <div id={`tech-dot-${issue.id}`} className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span id={`tech-name-${issue.id}`}>{issue.assignedTechnicianName}</span>
                                </div>
                              ) : (
                                <span id={`tech-unassigned-${issue.id}`} className="text-gray-400 italic">Pending Dispatch</span>
                              )}
                            </td>
                            <td id={`td-issue-act-${issue.id}`} className="p-4 text-right">
                              <button
                                id={`inspect-btn-${issue.id}`}
                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-900 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ticket Details Side Panel */}
            {selectedIssue && (
              <div id="ticket-detail-panel" className="w-full xl:w-100 bg-white border border-gray-200 rounded-xl shadow-xs p-6 space-y-6">
                {/* Header */}
                <div id="panel-header" className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div id="panel-title-block">
                    <div id="panel-meta-row" className="flex items-center gap-2">
                      <span id="panel-id" className="text-xs font-mono font-semibold text-blue-600">{selectedIssue.id}</span>
                      <span id="panel-status" className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-mono">{selectedIssue.status}</span>
                    </div>
                    <h3 id="panel-title" className="text-base font-bold text-gray-900 mt-2">{selectedIssue.title}</h3>
                    <p id="panel-asset" className="text-xs text-gray-400 font-medium mt-0.5">Asset: {selectedIssue.assetName}</p>
                  </div>
                  <button
                    id="close-panel-btn"
                    onClick={() => setSelectedIssue(null)}
                    className="p-1 text-gray-400 hover:bg-gray-100 rounded-md hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <div id="panel-description" className="space-y-2">
                  <h4 id="desc-lbl" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original Fault Report</h4>
                  <p id="desc-text" className="text-xs text-gray-700 bg-gray-50/50 p-4 border border-gray-100 rounded-xl leading-relaxed">
                    "{selectedIssue.description}"
                  </p>
                </div>

                {/* Dispatch & Assign Control */}
                <div id="panel-dispatch" className="space-y-3 bg-blue-50/30 p-4 border border-blue-100/50 rounded-xl">
                  <h4 id="dispatch-lbl" className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Dispatch Work Force
                  </h4>
                  <div id="assign-selector" className="space-y-1.5">
                    <label id="assign-lbl" className="block text-[11px] text-gray-500 font-semibold">Assign On-Duty Field Engineer</label>
                    <select
                      id="assign-tech-select"
                      value={selectedIssue.assignedTechnicianId || ''}
                      onChange={(e) => handleAssignTechnician(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs py-2 px-3 focus:outline-hidden text-gray-700"
                    >
                      <option value="">-- Select Available Technician --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.specialty}) • {t.status === 'Available' ? '🟢 Available' : '🟡 On Job'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedIssue.status !== 'Resolved' && selectedIssue.assignedTechnicianId && (
                    <button
                      id="resolve-ticket-btn"
                      onClick={handleResolveTicket}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-4 h-4" /> Resolve Ticket & Restore Asset
                    </button>
                  )}
                </div>

                {/* AI Analysis Diagnostic Accordion */}
                {selectedIssue.aiAnalysis ? (
                  <div id="panel-ai-analytics" className="border border-purple-200 bg-purple-50/20 rounded-xl p-4 space-y-4">
                    <div id="ai-header" className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" /> AI Triage Intelligence
                    </div>

                    <div id="ai-spec-grid" className="grid grid-cols-2 gap-4 text-xs">
                      <div id="ai-spec-priority">
                        <span id="ai-spec-lbl-prio" className="text-gray-400">Calculated Priority</span>
                        <span id="ai-spec-val-prio" className="block font-bold text-red-700 mt-0.5 uppercase tracking-wide">{selectedIssue.aiAnalysis.priority}</span>
                      </div>
                      <div id="ai-spec-category">
                        <span id="ai-spec-lbl-cat" className="text-gray-400">Classified Department</span>
                        <span id="ai-spec-val-cat" className="block font-semibold text-purple-900 mt-0.5 truncate">{selectedIssue.aiAnalysis.category}</span>
                      </div>
                    </div>

                    <div id="ai-causes" className="space-y-1.5">
                      <span id="ai-causes-lbl" className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Suggested Root Causes</span>
                      <ul id="ai-causes-list" className="list-disc pl-4 space-y-1 text-xs text-gray-700 font-medium">
                        {selectedIssue.aiAnalysis.possibleCauses.map((cause: string, index: number) => (
                          <li key={index}>{cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div id="ai-checks" className="space-y-2">
                      <span id="ai-checks-lbl" className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Diagnostic Checklist</span>
                      <div id="ai-checks-list" className="space-y-1.5 text-xs text-gray-600 font-mono bg-white p-3 border border-purple-100 rounded-lg">
                        {selectedIssue.aiAnalysis.initialChecks.map((check: string, index: number) => (
                          <p key={index} className="leading-normal">{check}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="no-ai-panel" className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 text-center">
                    <p id="no-ai-text" className="text-xs text-gray-400 italic">No AI Analysis generated for manual reports.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= INTERACTIVE AI TRIAGE PORTAL ================= */
        <div id="ai-triage-portal" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto space-y-6">
          <div id="portal-header-block" className="flex items-center gap-3 pb-5 border-b border-gray-100">
            <div id="portal-icon-box" className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div id="portal-title-box">
              <h2 id="portal-heading" className="font-display font-bold text-xl text-gray-900">AI Diagnostic & Dispatch Portal</h2>
              <p id="portal-subheading" className="text-xs text-gray-500 mt-0.5">Paste field operator logs below. Gemini will automatically extract diagnostic specifications, priority levels, and draft a structured task checklist.</p>
            </div>
          </div>

          <div id="portal-form" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Side (1 Column) */}
            <div id="portal-input-side" className="md:col-span-1 space-y-4">
              <div id="portal-field-reporter">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reporter Name</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div id="portal-field-asset">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Target Asset *</label>
                <select
                  id="triage-asset-select"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg text-sm py-2 px-3 text-gray-700"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.id} • {a.name}</option>
                  ))}
                </select>
              </div>

              <div id="portal-field-desc">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Natural Language Fault Report *</label>
                <textarea
                  id="triage-description-input"
                  rows={6}
                  placeholder="e.g., The hydraulic fluid is spraying from forklift 105. It's completely non-responsive on the loading dock..."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>

              <button
                id="run-triage-btn"
                onClick={handleAiTriage}
                disabled={triageLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-55"
              >
                {triageLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run AI Triage
                  </>
                )}
              </button>
            </div>

            {/* Display / Output Side (2 Columns) */}
            <div id="portal-output-side" className="md:col-span-2 border border-gray-200 rounded-xl p-6 bg-gray-50/50 flex flex-col justify-center min-h-[400px]">
              {triageLoading ? (
                /* LOADING SEQUENCE */
                <div id="triage-loading-display" className="text-center space-y-4 max-w-sm mx-auto animate-pulse">
                  <div id="spinner-box" className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
                  <h4 id="loading-title" className="text-sm font-bold text-gray-800">Triage Intelligence Active</h4>
                  <p id="loading-step-text" className="text-xs text-gray-500 font-mono tracking-normal leading-normal">{triageProgressText}</p>
                </div>
              ) : aiResult ? (
                /* SUCCESSFUL ANALYSIS RESULTS */
                <div id="triage-results-display" className="space-y-6 animate-fade-in">
                  <div id="results-heading-row" className="flex items-center justify-between pb-3 border-b border-gray-200/55">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Analysis Result Payload</span>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full font-mono uppercase">AI CONFIDENT</span>
                  </div>

                  {/* Editable Fields Draft */}
                  <div id="results-editor-form" className="grid grid-cols-2 gap-4">
                    <div id="edit-field-title" className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Generated Title Draft</label>
                      <input
                        type="text"
                        value={triageTitle}
                        onChange={(e) => setTriageTitle(e.target.value)}
                        className="w-full px-3.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>

                    <div id="edit-field-cat">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Department</label>
                      <input
                        type="text"
                        value={triageCategory}
                        onChange={(e) => setTriageCategory(e.target.value)}
                        className="w-full px-3.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>

                    <div id="edit-field-priority">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assess Priority Level</label>
                      <select
                        value={triagePriority}
                        onChange={(e: any) => setTriagePriority(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Static diagnostic checklist summaries */}
                  <div id="diagnostic-cards-row" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div id="card-causes" className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Probable Causes
                      </h4>
                      <ul className="list-decimal pl-4 text-xs text-gray-600 space-y-1.5">
                        {aiResult.possibleCauses.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div id="card-checks" className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Initial Checks
                      </h4>
                      <div className="text-xs text-gray-600 font-mono space-y-1">
                        {aiResult.initialChecks.map((check: string, i: number) => (
                          <p key={i} className="leading-relaxed">{check}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission bar */}
                  <div id="results-actions-bar" className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      id="discard-triage-btn"
                      onClick={() => setAiResult(null)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Discard & Reset
                    </button>
                    <button
                      id="save-triage-ticket-btn"
                      onClick={handleLogTriagedTicket}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-4 h-4" /> Log Verified Ticket to Database
                    </button>
                  </div>
                </div>
              ) : (
                /* DEFAULT PORTAL PLACEHOLDER */
                <div id="portal-empty-display" className="text-center max-w-sm mx-auto space-y-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl mx-auto border border-blue-100">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-800">Preview Diagnostic Payload</h4>
                    <p className="text-xs text-gray-400">Analysis metrics, suggested causes, and step-by-step diagnostic checklists will generate dynamically here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
