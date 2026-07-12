import React from 'react';
import { Technician, WorkOrder, Issue } from '../types';
import { Mail, Phone, ShieldCheck, Briefcase, Clock, ToggleLeft, ToggleRight, Radio } from 'lucide-react';

interface TechniciansListProps {
  technicians: Technician[];
  workOrders: WorkOrder[];
  issues: Issue[];
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  isLoading: boolean;
}

export default function TechniciansList({ technicians, workOrders, issues, onUpdateTechnician, isLoading }: TechniciansListProps) {
  
  // Calculations helper for each technician's real workload
  const getActiveWorkload = (techId: string) => {
    const activeWOs = workOrders.filter(w => w.assignedTechnicianId === techId && w.status !== 'Completed').length;
    const activeIssues = issues.filter(i => i.assignedTechnicianId === techId && i.status !== 'Resolved').length;
    return activeWOs + activeIssues;
  };

  const handleStatusToggle = async (tech: Technician) => {
    const newStatus: Technician['status'] = tech.status === 'Offline' ? 'Available' : 'Offline';
    try {
      await onUpdateTechnician(tech.id, { status: newStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update technician status.");
    }
  };

  return (
    <div id="technicians-view-container" className="space-y-6 animate-fade-in">
      {/* Title */}
      <div id="tech-header-block">
        <h1 id="tech-main-heading" className="font-display font-bold text-3xl text-gray-900 tracking-tight">On-Duty Field Technicians</h1>
        <p id="tech-subheading" className="text-gray-500 text-sm mt-1">Real-time status check, specialized skill certifications, and active dispatches workload.</p>
      </div>

      {/* Grid of cards */}
      <div id="tech-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {technicians.map((tech) => {
          const workload = getActiveWorkload(tech.id);
          const isOnline = tech.status !== 'Offline';

          return (
            <div
              id={`tech-card-${tech.id}`}
              key={tech.id}
              className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative ${
                isOnline ? 'border-gray-200' : 'border-gray-100 opacity-75'
              }`}
            >
              {/* Header: Name and Status Dot */}
              <div id={`tech-card-header-${tech.id}`} className="space-y-1">
                <div id={`tech-name-row-${tech.id}`} className="flex items-center justify-between">
                  <div id={`tech-initials-avatar-${tech.id}`} className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <button
                    id={`status-toggle-btn-${tech.id}`}
                    onClick={() => handleStatusToggle(tech)}
                    disabled={isLoading}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                    title={tech.status === 'Offline' ? "Go Online" : "Go Offline"}
                  >
                    {tech.status === 'Offline' ? (
                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                    ) : (
                      <ToggleRight className="w-8 h-8 text-blue-600" />
                    )}
                  </button>
                </div>

                <div id={`tech-profile-info-${tech.id}`} className="pt-2">
                  <h3 id={`tech-name-${tech.id}`} className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {tech.name}
                  </h3>
                  <span id={`tech-specialty-${tech.id}`} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tech.specialty}</span>
                </div>
              </div>

              {/* Status indicator badge */}
              <div id={`tech-status-badge-row-${tech.id}`} className="my-4">
                <span id={`tech-status-badge-${tech.id}`} className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-flex items-center gap-1.5 ${
                  tech.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                  tech.status === 'On Job' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  <Radio id={`tech-status-radio-${tech.id}`} className={`w-3.5 h-3.5 ${tech.status === 'Available' ? 'animate-pulse text-green-500' : tech.status === 'On Job' ? 'text-amber-500' : 'text-gray-400'}`} />
                  {tech.status}
                </span>
              </div>

              {/* Workload stats */}
              <div id={`tech-stats-box-${tech.id}`} className="bg-gray-50/50 p-3 border border-gray-100 rounded-xl space-y-2 text-xs">
                <div id={`tech-active-workload-row-${tech.id}`} className="flex items-center justify-between">
                  <span id={`tech-workload-lbl-${tech.id}`} className="text-gray-400">Active Workload</span>
                  <span id={`tech-workload-val-${tech.id}`} className="font-bold text-gray-700">{workload} ticket{workload !== 1 ? 's' : ''}</span>
                </div>
                <div id={`tech-progress-bar-wrapper-${tech.id}`} className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    id={`tech-progress-bar-${tech.id}`}
                    style={{ width: `${Math.min(workload * 33.3, 100)}%` }}
                    className={`h-full rounded-full ${
                      workload === 0 ? 'bg-green-500' : workload < 3 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Contact info footer */}
              <div id={`tech-contact-box-${tech.id}`} className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                <a id={`tech-email-link-${tech.id}`} href={`mailto:${tech.email}`} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {tech.email}
                </a>
                <a id={`tech-phone-link-${tech.id}`} href={`tel:${tech.phone}`} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {tech.phone}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
