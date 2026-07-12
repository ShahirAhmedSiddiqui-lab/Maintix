import React from 'react';
import { Asset, Issue, WorkOrder, ActivityLog, Technician } from '../types';
import { Wrench, ShieldAlert, CheckCircle2, AlertOctagon, TrendingUp, ArrowRight, UserCheck, Activity, Clock, Trophy } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OverviewProps {
  assets: Asset[];
  issues: Issue[];
  workOrders: WorkOrder[];
  activityLogs: ActivityLog[];
  technicians?: Technician[];
  onNavigateToTab: (tab: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-mono">
        <p className="font-bold border-b border-slate-800 pb-1 mb-1 text-[10px] text-gray-400">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 items-center">
            <span className="text-gray-300 font-sans">{p.name}:</span>
            <span className="font-bold text-white font-mono">{p.value}{p.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview({ assets, issues, workOrders, activityLogs, technicians = [], onNavigateToTab }: OverviewProps) {
  // Calculations
  const activeIssues = issues.filter(i => i.status !== 'Resolved');
  const criticalIssuesCount = activeIssues.filter(i => i.priority === 'Critical' || i.priority === 'High').length;
  
  const pendingWorkOrders = workOrders.filter(w => w.status !== 'Completed');
  const activeAssetsCount = assets.length;
  const brokenCount = assets.filter(a => a.status === 'Broken').length;
  const degradedCount = assets.filter(a => a.status === 'Degraded').length;

  // Top performers calculations
  const techniciansList = (technicians && technicians.length > 0) ? technicians : [
    { id: "TECH-01", name: "Sarah Jenkins", specialty: "HVAC / Electrical Systems" },
    { id: "TECH-02", name: "Carlos Ramirez", specialty: "Mechanical / Industrial Systems" },
    { id: "TECH-03", name: "David Chen", specialty: "Robotics / Automation Control" },
    { id: "TECH-04", name: "Samantha Patel", specialty: "Heavy Machinery & Safety Specialist" }
  ];

  const basePerformance: Record<string, number> = {
    'TECH-01': 14, // Sarah Jenkins
    'TECH-02': 11, // Carlos Ramirez
    'TECH-03': 8,  // David Chen
    'TECH-04': 5   // Samantha Patel
  };

  const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. "2026-07"

  const performerCounts = techniciansList.map(tech => {
    // Count completed work orders where completedDate starts with currentMonthStr
    const actualCompletedCount = workOrders.filter(wo => 
      wo.status === 'Completed' && 
      wo.assignedTechnicianId === tech.id && 
      wo.completedDate && 
      wo.completedDate.startsWith(currentMonthStr)
    ).length;

    const baseCount = basePerformance[tech.id] || 0;
    const resolvedCount = baseCount + actualCompletedCount;

    // Generate initials for avatar
    const nameParts = tech.name.split(' ');
    const initials = nameParts.map(n => n[0]).join('').substring(0, 2);

    return {
      ...tech,
      resolvedCount,
      initials
    };
  });

  // Sort by resolvedCount descending
  const sortedPerformers = performerCounts.sort((a, b) => b.resolvedCount - a.resolvedCount);

  // Dynamically compute uptime based on broken and degraded machinery
  const uptimePercentage = Math.max(90.0, +(98.8 - (brokenCount * 1.4) - (degradedCount * 0.4)).toFixed(1));

  // Facility Uptime Trend over past 6 intervals
  const uptimeData = [
    { name: 'Jan 2026', uptime: 97.8 },
    { name: 'Feb 2026', uptime: 98.2 },
    { name: 'Mar 2026', uptime: 98.5 },
    { name: 'Apr 2026', uptime: 98.1 },
    { name: 'May 2026', uptime: 98.9 },
    { name: 'Jun 2026', uptime: uptimePercentage },
  ];

  // Dynamic calculations for MTTR by equipment category (simulates ticket pressure)
  const categoryAvgHours: Record<string, number> = {
    'HVAC / Cooling': 14.2,
    'Manufacturing / Robotics': 8.5,
    'Heavy Machinery': 21.0,
    'Electrical Systems': 6.2,
    'Plumbing / Infrastructure': 10.8,
  };

  // Adjust MTTR based on real unresolved issues in each category
  assets.forEach(asset => {
    const category = asset.category;
    if (category) {
      if (!categoryAvgHours[category]) {
        categoryAvgHours[category] = 12.0;
      }
      const activeIssuesInCat = issues.filter(i => i.category === category && i.status !== 'Resolved');
      activeIssuesInCat.forEach(issue => {
        if (issue.priority === 'Critical') categoryAvgHours[category] += 2.4;
        else if (issue.priority === 'High') categoryAvgHours[category] += 1.4;
        else categoryAvgHours[category] += 0.6;
      });
      categoryAvgHours[category] = +categoryAvgHours[category].toFixed(1);
    }
  });

  const resolutionData = Object.entries(categoryAvgHours).map(([category, hours]) => ({
    category,
    hours
  }));

  return (
    <div id="overview-view" className="space-y-8 animate-fade-in">
      {/* Welcome Heading */}
      <div id="overview-title-section" className="flex items-center justify-between">
        <div id="title-wrapper">
          <h1 id="dashboard-heading" className="font-display font-bold text-3xl text-gray-900 tracking-tight">Facility Hub</h1>
          <p id="dashboard-subheading" className="text-gray-500 text-sm mt-1">Operational health and active service dispatches for Assembly Yard 1.</p>
        </div>
        <div id="date-badge" className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono text-gray-500">
          SYSTEM LIVE • UTC {new Date().toISOString().slice(11,16)}
        </div>
      </div>

      {/* KPI Grid */}
      <div id="kpi-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div id="kpi-card-assets" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div id="kpi-header-1" className="flex items-center justify-between">
            <span id="kpi-title-1" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Assets</span>
            <div id="kpi-icon-wrapper-1" className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div id="kpi-value-section-1" className="mt-4 flex items-baseline gap-2">
            <span id="kpi-value-1" className="text-3xl font-bold text-gray-900 font-display">{activeAssetsCount}</span>
            <span id="kpi-badge-1" className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 100% monitored
            </span>
          </div>
          <p id="kpi-desc-1" className="text-xs text-gray-500 mt-2">All equipment scanned & tagged via IoT</p>
        </div>

        {/* KPI 2 */}
        <div id="kpi-card-work-orders" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div id="kpi-header-2" className="flex items-center justify-between">
            <span id="kpi-title-2" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Work Orders</span>
            <div id="kpi-icon-wrapper-2" className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div id="kpi-value-section-2" className="mt-4 flex items-baseline gap-2">
            <span id="kpi-value-2" className="text-3xl font-bold text-gray-900 font-display">{pendingWorkOrders.length}</span>
            <span id="kpi-badge-2" className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {workOrders.filter(w => w.status === 'In Progress').length} in progress
            </span>
          </div>
          <p id="kpi-desc-2" className="text-xs text-gray-500 mt-2">Preventative & corrective scheduling</p>
        </div>

        {/* KPI 3 */}
        <div id="kpi-card-issues" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div id="kpi-header-3" className="flex items-center justify-between">
            <span id="kpi-title-3" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unresolved Issues</span>
            <div id="kpi-icon-wrapper-3" className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div id="kpi-value-section-3" className="mt-4 flex items-baseline gap-2">
            <span id="kpi-value-3" className="text-3xl font-bold text-gray-900 font-display">{activeIssues.length}</span>
            {criticalIssuesCount > 0 ? (
              <span id="kpi-badge-3" className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {criticalIssuesCount} High Risk
              </span>
            ) : (
              <span id="kpi-badge-3" className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                All Safe
              </span>
            )}
          </div>
          <p id="kpi-desc-3" className="text-xs text-gray-500 mt-2">AI-assisted ticketing triage active</p>
        </div>

        {/* KPI 4 */}
        <div id="kpi-card-uptime" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div id="kpi-header-4" className="flex items-center justify-between">
            <span id="kpi-title-4" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Uptime Efficiency</span>
            <div id="kpi-icon-wrapper-4" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div id="kpi-value-section-4" className="mt-4 flex items-baseline gap-2">
            <span id="kpi-value-4" className="text-3xl font-bold text-gray-900 font-display">{uptimePercentage}%</span>
            <span id="kpi-badge-4" className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +0.2% MoM
            </span>
          </div>
          <p id="kpi-desc-4" className="text-xs text-gray-500 mt-2">Target uptime baseline is 98.0%</p>
        </div>
      </div>

      {/* Analytical Charts Section */}
      <div id="analytics-charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime Trend Chart */}
        <div id="uptime-trend-card" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Facility Asset Uptime Trend</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Average operational reliability across the last 6 cycles.</p>
            </div>
            <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono rounded">
              TARGET: 98.0%
            </span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={[94, 100]} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  name="Uptime"
                  unit="%"
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorUptime)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Order Resolution Time Chart */}
        <div id="resolution-time-card" className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Mean Time to Resolution (MTTR)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Average dispatch hours elapsed to resolve issues by category.</p>
            </div>
            <span className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold font-mono rounded">
              LATEST BATCH
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split(' ')[0]} // Show shorter label/first word
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="hours" 
                  name="Resolution Time"
                  unit="h"
                  fill="#2563eb" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Operational Dashboard Content Grid */}
      <div id="dashboard-body-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Critical Alerts & Schedules */}
        <div id="dashboard-left-column" className="lg:col-span-2 space-y-6">
          {/* Urgent Action Required Section */}
          <div id="urgent-actions-container" className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div id="urgent-header" className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div id="urgent-title-block">
                <h3 id="urgent-title" className="text-sm font-bold text-gray-900">Urgent Corrective Actions</h3>
                <p id="urgent-desc" className="text-xs text-gray-500 mt-0.5">Assets degraded or faults requiring immediate dispatch.</p>
              </div>
              <button
                id="view-all-issues-btn"
                onClick={() => onNavigateToTab('issues')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5"
              >
                Go to Triage Portal <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div id="urgent-list" className="divide-y divide-gray-100">
              {activeIssues.length === 0 ? (
                <div id="no-urgent-issues" className="p-8 text-center text-gray-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p id="no-urgent-text" className="text-sm font-medium">All equipment running perfectly.</p>
                  <p id="no-urgent-subtext" className="text-xs text-gray-400 mt-1">No active unresolved issues logged.</p>
                </div>
              ) : (
                activeIssues.slice(0, 3).map((issue) => (
                  <div id={`urgent-item-${issue.id}`} key={issue.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <div id={`urgent-badge-col-${issue.id}`} className="mt-1 flex-shrink-0">
                      {issue.priority === 'Critical' || issue.priority === 'High' ? (
                        <div id={`critical-badge-${issue.id}`} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                          <AlertOctagon className="w-4 h-4" />
                        </div>
                      ) : (
                        <div id={`warning-badge-${issue.id}`} className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                          <AlertOctagon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    <div id={`urgent-details-col-${issue.id}`} className="flex-1 min-w-0">
                      <div id={`urgent-meta-row-${issue.id}`} className="flex items-center gap-2">
                        <span id={`urgent-asset-name-${issue.id}`} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{issue.assetName}</span>
                        <span id={`urgent-priority-pill-${issue.id}`} className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          issue.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          issue.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          issue.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {issue.priority}
                        </span>
                      </div>
                      <h4 id={`urgent-issue-title-${issue.id}`} className="text-sm font-semibold text-gray-900 mt-1">{issue.title}</h4>
                      <p id={`urgent-issue-desc-${issue.id}`} className="text-xs text-gray-500 mt-1 line-clamp-2">{issue.description}</p>
                      
                      <div id={`urgent-footer-row-${issue.id}`} className="flex items-center justify-between mt-3 text-xs text-gray-400">
                        <span id={`urgent-reporter-${issue.id}`}>Reported by {issue.reportedBy}</span>
                        <span id={`urgent-status-badge-${issue.id}`} className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-mono">
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scheduled Work Orders Block */}
          <div id="scheduled-workorders-container" className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div id="wo-header" className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div id="wo-title-block">
                <h3 id="wo-title" className="text-sm font-bold text-gray-900">Upcoming Work Orders</h3>
                <p id="wo-desc" className="text-xs text-gray-500 mt-0.5">Schedules dispatch checklist for field engineers.</p>
              </div>
              <button
                id="view-all-wo-btn"
                onClick={() => onNavigateToTab('schedule')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5"
              >
                Go to Work Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div id="wo-list" className="divide-y divide-gray-100">
              {pendingWorkOrders.length === 0 ? (
                <div id="no-wo-div" className="p-8 text-center text-gray-500">
                  <p id="no-wo-text" className="text-sm font-medium">No pending schedules listed.</p>
                </div>
              ) : (
                pendingWorkOrders.slice(0, 3).map((wo) => (
                  <div id={`wo-item-${wo.id}`} key={wo.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div id={`wo-flex-container-${wo.id}`} className="flex items-start justify-between gap-4">
                      <div id={`wo-details-box-${wo.id}`} className="space-y-1">
                        <span id={`wo-asset-badge-${wo.id}`} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-mono">{wo.id} • {wo.assetName}</span>
                        <h4 id={`wo-title-text-${wo.id}`} className="text-sm font-semibold text-gray-900 mt-1">{wo.title}</h4>
                        <p id={`wo-desc-text-${wo.id}`} className="text-xs text-gray-500">{wo.description}</p>
                      </div>
                      <div id={`wo-status-box-${wo.id}`} className="text-right flex flex-col items-end justify-between h-full min-w-[120px]">
                        <span id={`wo-priority-pill-${wo.id}`} className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          wo.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          wo.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          wo.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {wo.priority}
                        </span>
                        <span id={`wo-due-date-${wo.id}`} className="text-xs font-semibold text-red-600 mt-2">Due: {wo.dueDate}</span>
                      </div>
                    </div>
                    
                    <div id={`wo-assignee-row-${wo.id}`} className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div id={`wo-technician-assigned-${wo.id}`} className="flex items-center gap-2">
                        <div id={`wo-tech-dot-${wo.id}`} className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span id={`wo-tech-name-${wo.id}`}>{wo.assignedTechnicianName ? `Assigned to: ${wo.assignedTechnicianName}` : "Unassigned / Dispatch Pending"}</span>
                      </div>
                      <span id={`wo-status-lbl-${wo.id}`} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] rounded-full uppercase font-bold tracking-wide">
                        {wo.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Top Performers & Live Activity Audit Logs */}
        <div id="dashboard-right-column" className="space-y-6">
          {/* Top Performers Widget */}
          <div id="top-performers-card" className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden hover:shadow-md transition-shadow">
            <div id="performers-header" className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 id="performers-title" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Top Performers</span>
                </h3>
                <p id="performers-desc" className="text-xs text-gray-500 mt-0.5">Most resolved work orders this month.</p>
              </div>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold font-mono rounded">
                THIS MONTH
              </span>
            </div>

            <div id="performers-list" className="p-5 divide-y divide-gray-100">
              {sortedPerformers.slice(0, 4).map((performer, idx) => {
                // Style for rankings
                const rankStyles = [
                  { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'font-bold' }, // 1st Gold
                  { badge: 'bg-slate-50 text-slate-700 border-slate-200', text: 'font-semibold' }, // 2nd Silver
                  { badge: 'bg-orange-50 text-orange-700 border-orange-200', text: 'font-semibold' }, // 3rd Bronze
                  { badge: 'bg-gray-50 text-gray-500 border-gray-100', text: 'text-gray-600' } // 4th
                ];
                const rank = rankStyles[idx] || rankStyles[3];

                return (
                  <div id={`performer-row-${performer.id}`} key={performer.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[11px] border ${rank.badge}`}>
                        {idx + 1}
                      </span>
                      
                      {/* Avatar Initials */}
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {performer.initials}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{performer.name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">{performer.specialty?.split(' ')[0]} Specialist</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-gray-900">{performer.resolvedCount}</span>
                      <span className="text-[10px] text-gray-400 font-medium block">completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="activity-log-card" className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[400px]">
            <div id="activity-header" className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 id="activity-title" className="text-sm font-bold text-gray-900">System Activity Logs</h3>
              <p id="activity-desc" className="text-xs text-gray-500 mt-0.5">Audit log of system events, reporting, and maintenance.</p>
            </div>
            
            <div id="activity-scroll-body" className="flex-1 overflow-y-auto p-5 space-y-4">
              {activityLogs.length === 0 ? (
                <p id="no-logs" className="text-xs text-gray-400 text-center py-8">No events logged yet.</p>
              ) : (
                activityLogs.map((log) => (
                  <div id={`log-item-${log.id}`} key={log.id} className="flex gap-3 text-xs leading-relaxed">
                    <div id={`log-dot-col-${log.id}`} className="flex flex-col items-center">
                      <div id={`log-indicator-${log.id}`} className={`w-3 h-3 rounded-full border-2 ${
                        log.type === 'asset_created' ? 'border-green-500 bg-green-50' :
                        log.type === 'issue_reported' ? 'border-red-500 bg-red-50' :
                        log.type === 'maintenance_completed' ? 'border-emerald-500 bg-emerald-50' :
                        'border-blue-500 bg-blue-50'
                      }`} />
                      <div id={`log-line-${log.id}`} className="w-[1px] flex-1 bg-gray-100 my-1" />
                    </div>
                    
                    <div id={`log-message-box-${log.id}`} className="flex-1 pb-4">
                      <div id={`log-meta-line-${log.id}`} className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                        <span id={`log-user-${log.id}`} className="font-semibold text-gray-600">{log.user}</span>
                        <span id={`log-time-${log.id}`}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p id={`log-msg-${log.id}`} className="text-gray-700 mt-1 font-medium">{log.message}</p>
                      {log.details && (
                        <p id={`log-details-${log.id}`} className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md p-1.5 mt-1 font-mono">{log.details}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
