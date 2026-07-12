import React, { useState } from 'react';
import { Asset, WorkOrder, Technician } from '../types';
import { Search, Plus, CalendarRange, SlidersHorizontal, ChevronRight, X, Calendar, User, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ScheduleListProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  technicians: Technician[];
  onAddWorkOrder: (wo: Omit<WorkOrder, 'id'>) => Promise<void>;
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;
  isLoading: boolean;
}

export default function ScheduleList({ workOrders, assets, technicians, onAddWorkOrder, onUpdateWorkOrder, isLoading }: ScheduleListProps) {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [newWO, setNewWO] = useState({
    title: '',
    assetId: '',
    description: '',
    priority: 'Medium' as WorkOrder['priority'],
    dueDate: new Date().toISOString().split('T')[0],
    assignedTechnicianId: ''
  });
  const [formError, setFormError] = useState('');

  // Filtering
  const filteredOrders = workOrders.filter(wo => {
    const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wo.assetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || wo.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'All' || wo.status === selectedStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Handler for direct status updates (e.g. In Progress, Completed)
  const handleStatusChange = async (id: string, status: WorkOrder['status']) => {
    try {
      await onUpdateWorkOrder(id, { status });
    } catch (err: any) {
      alert(err.message || "Failed to update work order status.");
    }
  };

  // Handler for technician assignment updates
  const handleTechChange = async (id: string, techId: string) => {
    try {
      await onUpdateWorkOrder(id, { assignedTechnicianId: techId });
    } catch (err: any) {
      alert(err.message || "Failed to update work order assignment.");
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newWO.title || !newWO.assetId || !newWO.dueDate) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const asset = assets.find(a => a.id === newWO.assetId);
    
    try {
      await onAddWorkOrder({
        title: newWO.title,
        assetId: newWO.assetId,
        assetName: asset ? asset.name : "General Facility",
        description: newWO.description,
        priority: newWO.priority,
        status: newWO.assignedTechnicianId ? 'Assigned' : 'Scheduled',
        assignedTechnicianId: newWO.assignedTechnicianId || undefined,
        dueDate: newWO.dueDate
      });
      
      setIsAddOpen(false);
      // Reset form
      setNewWO({
        title: '',
        assetId: '',
        description: '',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTechnicianId: ''
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule work order.');
    }
  };

  return (
    <div id="schedule-management-view" className="space-y-6 animate-fade-in relative">
      {/* Title block */}
      <div id="schedule-header" className="flex items-center justify-between">
        <div id="schedule-title-block">
          <h1 id="schedule-main-heading" className="font-display font-bold text-3xl text-gray-900 tracking-tight">Work Orders & Schedules</h1>
          <p id="schedule-subheading" className="text-gray-500 text-sm mt-1">Schedules checklist, preventatives checklist, and active dispatches.</p>
        </div>
        <button
          id="add-wo-modal-btn"
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Schedule Work Order
        </button>
      </div>

      {/* Toolbar */}
      <div id="schedule-toolbar" className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col gap-4 lg:flex-row lg:items-center justify-between shadow-xs">
        <div id="schedule-search-box" className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="schedule-search-input"
            type="text"
            placeholder="Search work orders by ID, title, asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>

        <div id="schedule-filters-group" className="flex flex-wrap items-center gap-3">
          <div id="filter-lbl" className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </div>

          <select
            id="wo-priority-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            id="wo-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Enterprise Table List */}
      <div id="schedule-table-container" className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden w-full">
        <div id="schedule-table-scroll" className="overflow-x-auto">
          <table id="schedule-enterprise-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Work Order Title</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Assigned Engineer</th>
                <th className="p-4">Operational Status</th>
                <th className="p-4 text-right">Dispatch Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No scheduled work orders match these conditions.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => (
                  <tr id={`wo-row-${wo.id}`} key={wo.id} className="hover:bg-gray-50/50 transition-colors">
                    <td id={`td-wo-id-${wo.id}`} className="p-4 font-mono text-xs font-semibold text-blue-600">{wo.id}</td>
                    <td id={`td-wo-details-${wo.id}`} className="p-4">
                      <div id={`wo-desc-box-${wo.id}`} className="flex flex-col max-w-sm">
                        <span id={`wo-title-text-${wo.id}`} className="font-semibold text-gray-900">{wo.title}</span>
                        <span id={`wo-asset-name-${wo.id}`} className="text-xs text-gray-400 font-medium mt-0.5">{wo.assetName}</span>
                        {wo.description && (
                          <span id={`wo-full-desc-${wo.id}`} className="text-xs text-gray-500 mt-1 italic">"{wo.description}"</span>
                        )}
                      </div>
                    </td>
                    <td id={`td-wo-priority-${wo.id}`} className="p-4">
                      <span id={`wo-priority-pill-${wo.id}`} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${
                        wo.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        wo.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        wo.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td id={`td-wo-date-${wo.id}`} className="p-4 text-xs font-mono font-medium text-gray-600">
                      {wo.dueDate}
                      {wo.completedDate && (
                        <span id={`wo-completed-date-${wo.id}`} className="block text-[10px] text-green-600 font-sans mt-0.5 font-bold">Completed: {wo.completedDate}</span>
                      )}
                    </td>
                    <td id={`td-wo-tech-${wo.id}`} className="p-4">
                      {wo.status === 'Completed' ? (
                        <span id={`wo-tech-completed-${wo.id}`} className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {wo.assignedTechnicianName || "Facility Engineer"}
                        </span>
                      ) : (
                        <select
                          id={`wo-tech-change-${wo.id}`}
                          value={wo.assignedTechnicianId || ''}
                          onChange={(e) => handleTechChange(wo.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg text-xs py-1 px-2 text-gray-700 focus:outline-hidden"
                        >
                          <option value="">-- Assign Tech --</option>
                          {technicians.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td id={`td-wo-status-${wo.id}`} className="p-4">
                      <span id={`wo-status-pill-${wo.id}`} className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        wo.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        wo.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        wo.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {wo.status}
                      </span>
                    </td>
                    <td id={`td-wo-actions-${wo.id}`} className="p-4 text-right">
                      {wo.status !== 'Completed' && (
                        <div id={`dispatch-action-group-${wo.id}`} className="flex items-center justify-end gap-1.5">
                          {wo.status === 'Scheduled' && wo.assignedTechnicianId && (
                            <button
                              id={`dispatch-assign-btn-${wo.id}`}
                              onClick={() => handleStatusChange(wo.id, 'Assigned')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md transition-colors"
                            >
                              Dispatch
                            </button>
                          )}
                          {wo.status === 'Assigned' && (
                            <button
                              id={`dispatch-start-btn-${wo.id}`}
                              onClick={() => handleStatusChange(wo.id, 'In Progress')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                            >
                              Start Job
                            </button>
                          )}
                          {wo.status === 'In Progress' && (
                            <button
                              id={`dispatch-complete-btn-${wo.id}`}
                              onClick={() => handleStatusChange(wo.id, 'Completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create WO Schedule Modal */}
      {isAddOpen && (
        <div id="add-wo-modal-overlay" className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="add-wo-modal" className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            <div id="modal-header" className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 id="modal-title" className="font-display font-bold text-lg text-gray-900">Schedule Preventative Maintenance</h3>
              <button
                id="modal-close-btn"
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="schedule-wo-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div id="form-error-banner" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div id="form-grid" className="space-y-4">
                <div id="form-field-title">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Work Order Subject / Title *</label>
                  <input
                    id="input-wo-title"
                    type="text"
                    required
                    placeholder="e.g. Monthly Lubrication and Calibration Check"
                    value={newWO.title}
                    onChange={(e) => setNewWO({ ...newWO, title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div id="form-field-asset">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Affected Facility Asset *</label>
                  <select
                    id="input-wo-asset"
                    required
                    value={newWO.assetId}
                    onChange={(e) => setNewWO({ ...newWO, assetId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Target Equipment --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.id} • {a.name} ({a.location})</option>
                    ))}
                  </select>
                </div>

                <div id="form-field-desc">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Job Scope / Instructions</label>
                  <textarea
                    id="input-wo-desc"
                    rows={3}
                    placeholder="Provide step-by-step diagnostic or lubrication details..."
                    value={newWO.description}
                    onChange={(e) => setNewWO({ ...newWO, description: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div id="form-grid-flex" className="grid grid-cols-2 gap-4">
                  <div id="form-field-priority">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority Level</label>
                    <select
                      id="input-wo-priority"
                      value={newWO.priority}
                      onChange={(e) => setNewWO({ ...newWO, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div id="form-field-duedate">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Target Due Date *</label>
                    <input
                      id="input-wo-duedate"
                      type="date"
                      required
                      value={newWO.dueDate}
                      onChange={(e) => setNewWO({ ...newWO, dueDate: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div id="form-field-tech">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Assign Lead Technician (Optional)</label>
                  <select
                    id="input-wo-tech"
                    value={newWO.assignedTechnicianId}
                    onChange={(e) => setNewWO({ ...newWO, assignedTechnicianId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- No Assignment / Dispatch Later --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialty}) • {t.status === 'Available' ? 'Available' : 'Busy'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div id="modal-footer" className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  id="cancel-wo-btn"
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="submit-wo-btn"
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {isLoading ? 'Scheduling...' : 'Save Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
