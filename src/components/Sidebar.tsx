import React from 'react';
import { LayoutDashboard, Wrench, AlertTriangle, CalendarRange, Users, ShieldAlert, LogOut, QrCode } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  issuesCount: number;
  onLogout?: () => void;
}

export default function Sidebar({ currentTab, setTab, issuesCount, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets', icon: Wrench },
    { id: 'issues', label: 'Issues & AI Triage', icon: AlertTriangle, badge: issuesCount > 0 ? issuesCount : undefined },
    { id: 'schedule', label: 'Work Orders', icon: CalendarRange },
    { id: 'technicians', label: 'Technicians', icon: Users },
    { id: 'qr', label: 'QR Tag Generator', icon: QrCode },
  ];

  return (
    <aside id="sidebar-container" className="w-64 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div id="brand-header" className="h-16 flex items-center px-6 border-b border-gray-100 gap-2.5">
        <div id="logo-icon-wrapper" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <ShieldAlert id="logo-icon" className="w-5 h-5" />
        </div>
        <div id="logo-text-wrapper" className="flex flex-col">
          <span id="logo-brand-name" className="font-display font-bold text-lg text-gray-900 tracking-tight leading-none">Maintix</span>
          <span id="logo-subtext" className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">Enterprise SaaS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div id={`nav-item-content-${item.id}`} className="flex items-center gap-3">
                <Icon id={`nav-item-icon-${item.id}`} className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span id={`nav-item-label-${item.id}`}>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  id={`nav-item-badge-${item.id}`}
                  className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600"
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div id="sidebar-footer" className="p-4 border-t border-gray-100">
        <div id="footer-user-profile" className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group">
          <div id="user-info-side" className="flex items-center gap-2.5 min-w-0">
            <div id="user-avatar" className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              ER
            </div>
            <div id="user-meta" className="flex flex-col min-w-0">
              <span id="user-display-name" className="text-xs font-semibold text-gray-800 truncate">Elena Rostova</span>
              <span id="user-role" className="text-[10px] text-gray-400 truncate">Facility Admin</span>
            </div>
          </div>
          {onLogout && (
            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
