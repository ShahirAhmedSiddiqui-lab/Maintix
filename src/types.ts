export type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';
export type AssetStatus = 'Operational' | 'Maintenance' | 'Broken' | 'Degraded';
export type IssueStatus = 'New' | 'Triaged' | 'In Progress' | 'Resolved';
export type WorkOrderStatus = 'Scheduled' | 'Assigned' | 'In Progress' | 'Completed';
export type TechStatus = 'Available' | 'On Job' | 'Offline';

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
  location: string;
  installDate: string;
  criticality: Criticality;
  model: string;
  serialNumber: string;
  lastMaintenanceDate?: string;
  maintenanceCount: number;
}

export interface AIAnalysis {
  title: string;
  category: string;
  priority: Criticality;
  possibleCauses: string[];
  initialChecks: string[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  category: string;
  priority: Criticality;
  status: IssueStatus;
  reportedBy: string;
  reportedDate: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  aiAnalysis?: AIAnalysis | null;
}

export interface WorkOrder {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  description: string;
  priority: Criticality;
  status: WorkOrderStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  dueDate: string;
  completedDate?: string;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: TechStatus;
  currentWorkload: number;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface ActivityLog {
  id: string;
  type: 'asset_created' | 'issue_reported' | 'work_order_assigned' | 'status_change' | 'maintenance_completed';
  timestamp: string;
  message: string;
  user: string;
  details?: string;
}
