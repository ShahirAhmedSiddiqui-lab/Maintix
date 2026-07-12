import React, { useState } from 'react';
import { Asset, Issue, WorkOrder } from '../types';
import { X, ShieldAlert, CheckCircle, Clock, Cpu, MapPin, ClipboardList, AlertTriangle, Plus, Tag } from 'lucide-react';

interface TechAssetHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assets: Asset[];
  issues: Issue[];
  workOrders: WorkOrder[];
  onReportIssue: (payload: any) => Promise<void>;
}

export default function TechAssetHubModal({
  isOpen,
  onClose,
  assetId,
  assets,
  issues,
  workOrders,
  onReportIssue
}: TechAssetHubModalProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [newFault, setNewFault] = useState({
    title: '',
    description: '',
    priority: 'High' as 'Low' | 'Medium' | 'High' | 'Critical'
  });
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const asset = assets.find(a => a.id === assetId);
  if (!asset) {
    return (
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 max-w-sm w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-bold text-lg text-gray-900">Asset Not Found</h3>
          <p className="text-sm text-gray-500">The scanned asset ID "{assetId}" is not in the system registry.</p>
          <button onClick={onClose} className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold">Close</button>
        </div>
      </div>
    );
  }

  // Filter asset-specific items
  const activeAssetIssues = issues.filter(i => i.assetId === assetId && i.status !== 'Resolved');
  const activeAssetWorkOrders = workOrders.filter(w => w.assetId === assetId && w.status !== 'Completed');

  // Dynamic checklists based on asset category
  const getDiagnosticChecklist = (category: string) => {
    switch (category) {
      case 'HVAC / Cooling':
        return [
          'Verify compressor coolant pressure levels.',
          'Clean air filter housing and check intake fan rotation.',
          'Inspect compressor drive belt for cracks or laxity.',
          'Verify condensate discharge line is free of sediment.'
        ];
      case 'Manufacturing / Robotics':
      case 'Heavy Machinery':
        return [
          'Verify hydraulic oil levels and check seal pressure.',
          'Inspect mechanical joints for high-temperature wear.',
          'Test automated safety optical curtains & emergency stop.',
          'Recalibrate precise servo rotation values.'
        ];
      case 'Electrical Systems':
        return [
          'Perform thermal imaging scan on breaker terminals.',
          'Verify backup UPS batteries charge and relay load.',
          'Tighten auxiliary connection lugs to standard torque.',
          'Inspect grounding lead resistance levels.'
        ];
      default:
        return [
          'Check main circuit power feeds and indicator lamps.',
          'Inspect hardware enclosure for excessive heat or vibration.',
          'Test manual override operations.',
          'Sign and date physical safety log tag.'
        ];
    }
  };

  const checklist = getDiagnosticChecklist(asset.category);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');

    if (!newFault.title || !newFault.description) {
      setSubmitError('Please enter a title and description.');
      return;
    }

    try {
      await onReportIssue({
        assetId: asset.id,
        title: newFault.title,
        description: newFault.description,
        priority: newFault.priority,
        category: asset.category,
        assignedTechnicianId: '' // Dispatch pending
      });

      setSuccessMsg('Issue logged successfully! Dispatch center notified.');
      setNewFault({ title: '', description: '', priority: 'High' });
      
      // Clear message after 3 seconds and close reporting form
      setTimeout(() => {
        setSuccessMsg('');
        setIsReporting(false);
      }, 3000);

    } catch (err: any) {
      setSubmitError(err.message || 'Failed to file fault ticket.');
    }
  };

  return (
    <div id="tech-asset-hub-overlay" className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div id="tech-asset-hub-card" className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div id="tech-hub-header" className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs flex items-center justify-center">TAG</span>
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">{asset.id}</span>
              <h3 className="font-display font-bold text-base text-gray-900 leading-tight">{asset.name}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">Operating Status</span>
              <span className={`px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 border ${
                asset.status === 'Operational' ? 'bg-green-50 text-green-700 border-green-200' :
                asset.status === 'Maintenance' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {asset.status}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Criticality</span>
              <span className={`font-semibold uppercase ${
                asset.criticality === 'Critical' ? 'text-red-600' :
                asset.criticality === 'High' ? 'text-orange-600' : 'text-gray-700'
              }`}>{asset.criticality}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Model / Type</span>
              <span className="font-semibold text-gray-700 font-mono truncate block">{asset.model}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Location</span>
              <span className="font-semibold text-gray-700 block truncate">{asset.location}</span>
            </div>
          </div>

          {/* Diagnostics Checklist Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Diagnostic Checklist & SOP Guidelines</span>
            </h4>
            <div className="border border-blue-100 bg-blue-50/20 rounded-xl p-4 space-y-2.5">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-blue-100/60 text-blue-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Job Dispatches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Active Tickets */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Fault Tickets</h4>
              <div className="border border-gray-150 rounded-xl divide-y divide-gray-100 overflow-hidden text-xs">
                {activeAssetIssues.length === 0 ? (
                  <p className="p-4 text-gray-400 text-center">No active faults logged</p>
                ) : (
                  activeAssetIssues.map(issue => (
                    <div key={issue.id} className="p-3 bg-red-50/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700 font-mono text-[10px]">{issue.id}</span>
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] font-bold rounded">{issue.priority}</span>
                      </div>
                      <p className="font-semibold text-gray-800">{issue.title}</p>
                      <p className="text-gray-500 text-[11px] line-clamp-2">{issue.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Work Orders */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Work Schedules</h4>
              <div className="border border-gray-150 rounded-xl divide-y divide-gray-100 overflow-hidden text-xs">
                {activeAssetWorkOrders.length === 0 ? (
                  <p className="p-4 text-gray-400 text-center">No active work schedules</p>
                ) : (
                  activeAssetWorkOrders.map(wo => (
                    <div key={wo.id} className="p-3 bg-yellow-50/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-yellow-700 font-mono text-[10px]">{wo.id}</span>
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-bold rounded uppercase">{wo.status}</span>
                      </div>
                      <p className="font-semibold text-gray-800">{wo.title}</p>
                      <p className="text-gray-400 text-[10px]">Due: {wo.dueDate}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Quick Issue Reporting Form Toggle */}
          <div className="pt-2 border-t border-gray-100">
            {!isReporting ? (
              <button
                type="button"
                onClick={() => setIsReporting(true)}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Report New Asset Breakdown
              </button>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-gray-900">File Breakdown Dispatch</h5>
                  <button type="button" onClick={() => setIsReporting(false)} className="text-gray-400 hover:text-gray-600 font-semibold text-[11px]">Cancel</button>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg font-medium flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {submitError}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg font-medium flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {successMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Headline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Compressor belt slipping or high temperature readings"
                      value={newFault.title}
                      onChange={(e) => setNewFault({ ...newFault, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Observation Details *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Specify sensor telemetry, visual leaks, abnormal sounds, etc..."
                      value={newFault.description}
                      onChange={(e) => setNewFault({ ...newFault, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Priority Dispatch Level *</label>
                    <select
                      value={newFault.priority}
                      onChange={(e) => setNewFault({ ...newFault, priority: e.target.value as any })}
                      className="w-full px-2 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="Low">Low - Deferred</option>
                      <option value="Medium">Medium - Standard Routine</option>
                      <option value="High">High - Prompt Action Requested</option>
                      <option value="Critical">Critical - Production Downtime Alert</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Confirm Fault Ticket Submission
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <div id="tech-hub-footer" className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition-colors">
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
}
