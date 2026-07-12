import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { Search, Plus, SlidersHorizontal, ChevronRight, X, Calendar, MapPin, Tag, Cpu, ShieldAlert, Check, Printer } from 'lucide-react';

interface AssetsListProps {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'maintenanceCount'>) => Promise<void>;
  isLoading: boolean;
  defaultSelectedId?: string | null;
  onClearDefaultSelection?: () => void;
}

export default function AssetsList({ assets, onAddAsset, isLoading, defaultSelectedId, onClearDefaultSelection }: AssetsListProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCriticality, setSelectedCriticality] = useState('All');
  const [sortField, setSortField] = useState<keyof Asset>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Handle external defaultSelectedId (e.g., from QR scan)
  useEffect(() => {
    if (defaultSelectedId) {
      const matched = assets.find(a => a.id === defaultSelectedId);
      if (matched) {
        setSelectedAsset(matched);
        // Auto-clear search/filters to ensure the selected asset is fully visible and in context
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedStatus('All');
        setSelectedCriticality('All');
      }
    }
  }, [defaultSelectedId, assets]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'HVAC / Cooling',
    status: 'Operational' as Asset['status'],
    location: '',
    installDate: new Date().toISOString().split('T')[0],
    criticality: 'Medium' as Asset['criticality'],
    model: '',
    serialNumber: ''
  });
  const [formError, setFormError] = useState('');

  // Extract unique values for filters
  const categories = ['All', ...Array.from(new Set(assets.map(a => a.category)))];
  const statuses = ['All', 'Operational', 'Maintenance', 'Broken', 'Degraded'];
  const criticalities = ['All', 'Low', 'Medium', 'High', 'Critical'];

  // Sorting logic
  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and search
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
    const matchesCriticality = selectedCriticality === 'All' || asset.criticality === selectedCriticality;

    return matchesSearch && matchesCategory && matchesStatus && matchesCriticality;
  });

  // Sort final array
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newAsset.name || !newAsset.location || !newAsset.model || !newAsset.serialNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await onAddAsset(newAsset);
      setIsAddOpen(false);
      // Reset form
      setNewAsset({
        name: '',
        category: 'HVAC / Cooling',
        status: 'Operational',
        location: '',
        installDate: new Date().toISOString().split('T')[0],
        criticality: 'Medium',
        model: '',
        serialNumber: ''
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to add asset.');
    }
  };

  return (
    <div id="assets-management-view" className="space-y-6 animate-fade-in relative">
      {/* Title & Add Bar */}
      <div id="assets-header" className="flex items-center justify-between">
        <div id="assets-title-block">
          <h1 id="assets-main-heading" className="font-display font-bold text-3xl text-gray-900 tracking-tight">Assets Directory</h1>
          <p id="assets-subheading" className="text-gray-500 text-sm mt-1">Enterprise hardware assets, warranty logs, and real-time maintenance telemetry.</p>
        </div>
        <button
          id="add-asset-modal-btn"
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add New Asset
        </button>
      </div>

      {/* Toolbar - Search & Filters */}
      <div id="assets-toolbar" className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col gap-4 lg:flex-row lg:items-center justify-between shadow-xs">
        {/* Search */}
        <div id="search-box" className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="asset-search-input"
            type="text"
            placeholder="Search assets by ID, name, model, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div id="filter-controls-group" className="flex flex-wrap items-center gap-3">
          <div id="filter-label" className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </div>

          {/* Category */}
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          {/* Status */}
          <select
            id="status-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>

          {/* Criticality */}
          <select
            id="criticality-filter-select"
            value={selectedCriticality}
            onChange={(e) => setSelectedCriticality(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {criticalities.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Criticalities' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Container - Split View (Table & Details) */}
      <div id="assets-content-split" className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Table Area */}
        <div id="assets-table-container" className="flex-1 bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden w-full">
          <div id="table-scroll-wrapper" className="overflow-x-auto">
            <table id="assets-enterprise-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th id="th-id" onClick={() => handleSort('id')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">ID</th>
                  <th id="th-name" onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">Asset Details</th>
                  <th id="th-category" onClick={() => handleSort('category')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">Category</th>
                  <th id="th-status" onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">Status</th>
                  <th id="th-criticality" onClick={() => handleSort('criticality')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">Criticality</th>
                  <th id="th-location" className="p-4">Location</th>
                  <th id="th-actions" className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No assets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  sortedAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <tr
                        id={`asset-row-${asset.id}`}
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600' : ''
                        }`}
                      >
                        <td id={`td-id-${asset.id}`} className="p-4 font-mono text-xs font-semibold text-blue-600">{asset.id}</td>
                        <td id={`td-name-${asset.id}`} className="p-4">
                          <div id={`asset-desc-box-${asset.id}`} className="flex flex-col">
                            <span id={`asset-title-${asset.id}`} className="font-semibold text-gray-900">{asset.name}</span>
                            <span id={`asset-model-${asset.id}`} className="text-xs text-gray-400 font-mono">{asset.model} • S/N {asset.serialNumber}</span>
                          </div>
                        </td>
                        <td id={`td-category-${asset.id}`} className="p-4 text-xs font-medium text-gray-500">{asset.category}</td>
                        <td id={`td-status-${asset.id}`} className="p-4">
                          <span id={`status-pill-${asset.id}`} className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 border ${
                            asset.status === 'Operational' ? 'bg-green-50 text-green-700 border-green-200' :
                            asset.status === 'Maintenance' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            asset.status === 'Degraded' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <span id={`status-dot-${asset.id}`} className={`w-1.5 h-1.5 rounded-full ${
                              asset.status === 'Operational' ? 'bg-green-500' :
                              asset.status === 'Maintenance' ? 'bg-yellow-500' :
                              asset.status === 'Degraded' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`} />
                            {asset.status}
                          </span>
                        </td>
                        <td id={`td-crit-${asset.id}`} className="p-4">
                          <span id={`crit-pill-${asset.id}`} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${
                            asset.criticality === 'Critical' ? 'bg-red-100 text-red-700' :
                            asset.criticality === 'High' ? 'bg-orange-100 text-orange-700' :
                            asset.criticality === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {asset.criticality}
                          </span>
                        </td>
                        <td id={`td-loc-${asset.id}`} className="p-4 text-xs text-gray-500">{asset.location}</td>
                        <td id={`td-act-${asset.id}`} className="p-4 text-right">
                          <button
                            id={`inspect-btn-${asset.id}`}
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

        {/* Side Details Drawer */}
        {selectedAsset && (
          <div id="asset-detail-drawer" className="w-full xl:w-96 bg-white border border-gray-200 rounded-xl shadow-xs p-6 space-y-6">
            {/* Header */}
            <div id="drawer-header" className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div id="drawer-title-block">
                <span id="drawer-id" className="text-xs font-mono font-semibold text-blue-600">{selectedAsset.id}</span>
                <h3 id="drawer-name" className="text-base font-bold text-gray-900 mt-1">{selectedAsset.name}</h3>
              </div>
              <button
                id="close-drawer-btn"
                onClick={() => {
                  setSelectedAsset(null);
                  onClearDefaultSelection?.();
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-md hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Specifications Card */}
            <div id="drawer-specifications" className="space-y-4">
              <h4 id="spec-section-title" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Specifications</h4>
              
              <div id="spec-list" className="grid grid-cols-2 gap-4 text-xs bg-gray-50/50 p-4 border border-gray-100 rounded-xl">
                <div id="spec-box-model" className="flex flex-col gap-1">
                  <span id="spec-lbl-model" className="text-gray-400">Model</span>
                  <span id="spec-val-model" className="font-semibold text-gray-700">{selectedAsset.model}</span>
                </div>
                <div id="spec-box-serial" className="flex flex-col gap-1">
                  <span id="spec-lbl-serial" className="text-gray-400">Serial Number</span>
                  <span id="spec-val-serial" className="font-semibold text-gray-700 font-mono">{selectedAsset.serialNumber}</span>
                </div>
                <div id="spec-box-install" className="flex flex-col gap-1">
                  <span id="spec-lbl-install" className="text-gray-400">Installation Date</span>
                  <span id="spec-val-install" className="font-semibold text-gray-700">{selectedAsset.installDate}</span>
                </div>
                <div id="spec-box-loc" className="flex flex-col gap-1">
                  <span id="spec-lbl-loc" className="text-gray-400">Location</span>
                  <span id="spec-val-loc" className="font-semibold text-gray-700">{selectedAsset.location}</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div id="drawer-metrics" className="grid grid-cols-2 gap-4 text-center">
              <div id="metric-box-maint" className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/30">
                <span id="metric-lbl-maint" className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Dispatches</span>
                <span id="metric-val-maint" className="block text-2xl font-bold text-gray-800 mt-1">{selectedAsset.maintenanceCount}</span>
              </div>
              <div id="metric-box-last" className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/30">
                <span id="metric-lbl-last" className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Last Serviced</span>
                <span id="metric-val-last" className="block text-xs font-semibold text-gray-700 mt-2 truncate">
                  {selectedAsset.lastMaintenanceDate || "Never"}
                </span>
              </div>
            </div>

            {/* QR Code Tag Card */}
            <div id="drawer-qr-card" className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div id="qr-card-header" className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Digital Asset Tag</span>
                <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">QR BARCODE</span>
              </div>
              <div id="qr-card-body" className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg border border-gray-200 shrink-0 shadow-2xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${selectedAsset.id}&color=0f172a&bgcolor=ffffff`}
                    alt={`QR tag for ${selectedAsset.id}`}
                    className="w-20 h-20"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-xs text-gray-500 leading-normal font-sans">
                    Scan on-site to inspect telemetry, manuals, or file dispatches instantly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Maintix Asset Tag - ${selectedAsset.id}</title>
                              <style>
                                body {
                                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                  margin: 0;
                                  padding: 40px;
                                  display: flex;
                                  justify-content: center;
                                  align-items: center;
                                  height: 80vh;
                                  background-color: #ffffff;
                                }
                                .tag {
                                  width: 280px;
                                  border: 2px solid #1e293b;
                                  border-radius: 12px;
                                  padding: 24px;
                                  text-align: center;
                                }
                                .brand {
                                  font-weight: 800;
                                  font-size: 14px;
                                  text-transform: uppercase;
                                  letter-spacing: 1.5px;
                                  color: #0f172a;
                                  border-bottom: 2px solid #1e293b;
                                  padding-bottom: 8px;
                                  margin-bottom: 16px;
                                }
                                .qr-img {
                                  margin: 16px auto;
                                  width: 140px;
                                  height: 140px;
                                }
                                .id {
                                  font-family: monospace;
                                  font-size: 20px;
                                  font-weight: bold;
                                  color: #2563eb;
                                  margin: 8px 0;
                                  letter-spacing: 1px;
                                }
                                .name {
                                  font-weight: 700;
                                  font-size: 15px;
                                  color: #0f172a;
                                  margin-bottom: 4px;
                                }
                                .model {
                                  font-size: 11px;
                                  color: #64748b;
                                  font-family: monospace;
                                }
                                .footer {
                                  font-size: 9px;
                                  color: #94a3b8;
                                  margin-top: 16px;
                                  font-family: monospace;
                                  border-top: 1px dashed #cbd5e1;
                                  padding-top: 10px;
                                  text-transform: uppercase;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="tag">
                                <div class="brand">MAINTIX ASSET SYSTEM</div>
                                <div class="name">${selectedAsset.name}</div>
                                <div class="model">${selectedAsset.model} • S/N ${selectedAsset.serialNumber}</div>
                                <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedAsset.id}&color=0f172a&bgcolor=ffffff" />
                                <div class="id">${selectedAsset.id}</div>
                                <div class="footer">Scan with device to view details</div>
                              </div>
                              <script>
                                window.onload = function() {
                                  window.print();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      } else {
                        alert("Please allow popups to print the asset tag.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Label Tag</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Asset Diagnostics / Static Timeline */}
            <div id="drawer-diagnostics" className="space-y-4 pt-2">
              <h4 id="diag-section-title" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historical Logs</h4>
              <div id="diag-timeline" className="space-y-3.5 text-xs">
                <div id="timeline-node-1" className="flex gap-2 pb-1.5 border-l border-gray-100 pl-4 relative">
                  <div id="timeline-dot-1" className="w-2 h-2 rounded-full bg-green-500 absolute -left-[4.5px] top-1.5" />
                  <div id="timeline-msg-box-1" className="space-y-0.5">
                    <p id="timeline-date-1" className="font-mono text-[10px] text-gray-400">2026-06-15 • Sarah Jenkins</p>
                    <p id="timeline-text-1" className="font-medium text-gray-700">Preventative Maintenance completed: filters changed, refrigerant pressure checked.</p>
                  </div>
                </div>
                <div id="timeline-node-2" className="flex gap-2 pb-1.5 border-l border-gray-100 pl-4 relative">
                  <div id="timeline-dot-2" className="w-2 h-2 rounded-full bg-blue-500 absolute -left-[4.5px] top-1.5" />
                  <div id="timeline-msg-box-2" className="space-y-0.5">
                    <p id="timeline-date-2" className="font-mono text-[10px] text-gray-400">2026-03-12 • Carlos Ramirez</p>
                    <p id="timeline-text-2" className="font-medium text-gray-700">Sensor calibration and seal integrity inspection complete.</p>
                  </div>
                </div>
                <div id="timeline-node-3" className="flex gap-2 pl-4 relative">
                  <div id="timeline-dot-3" className="w-2 h-2 rounded-full bg-gray-400 absolute -left-[4.5px] top-1.5" />
                  <div id="timeline-msg-box-3" className="space-y-0.5">
                    <p id="timeline-date-3" className="font-mono text-[10px] text-gray-400">{selectedAsset.installDate} • System Provision</p>
                    <p id="timeline-text-3" className="font-medium text-gray-500">Asset successfully installed and barcoded in Maintix system.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div id="add-asset-modal-overlay" className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="add-asset-modal" className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            <div id="modal-header" className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 id="modal-title" className="font-display font-bold text-lg text-gray-900">Add New Enterprise Asset</h3>
              <button
                id="modal-close-btn"
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="add-asset-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div id="form-error-banner" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div id="form-grid" className="grid grid-cols-2 gap-4">
                <div id="form-field-name" className="col-span-2">
                  <label id="lbl-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Asset Name *</label>
                  <input
                    id="input-name"
                    type="text"
                    required
                    placeholder="e.g. Server Room B Cooling Unit"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div id="form-field-category">
                  <label id="lbl-cat" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category *</label>
                  <select
                    id="input-cat"
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="HVAC / Cooling">HVAC / Cooling</option>
                    <option value="Manufacturing / Robotics">Manufacturing / Robotics</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="Electrical Systems">Electrical Systems</option>
                    <option value="Fleet / Vehicles">Fleet / Vehicles</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>

                <div id="form-field-criticality">
                  <label id="lbl-crit" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Criticality *</label>
                  <select
                    id="input-crit"
                    value={newAsset.criticality}
                    onChange={(e) => setNewAsset({ ...newAsset, criticality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div id="form-field-model">
                  <label id="lbl-model" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Model *</label>
                  <input
                    id="input-model"
                    type="text"
                    required
                    placeholder="e.g. Carrier WeatherMaster"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div id="form-field-serial">
                  <label id="lbl-serial" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Serial Number *</label>
                  <input
                    id="input-serial"
                    type="text"
                    required
                    placeholder="e.g. SN-938210-CR"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div id="form-field-location" className="col-span-2">
                  <label id="lbl-location" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Location *</label>
                  <input
                    id="input-location"
                    type="text"
                    required
                    placeholder="e.g. Data Center Room B"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div id="form-field-installdate" className="col-span-2">
                  <label id="lbl-install" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Installation Date *</label>
                  <input
                    id="input-install"
                    type="date"
                    required
                    value={newAsset.installDate}
                    onChange={(e) => setNewAsset({ ...newAsset, installDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div id="modal-footer" className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  id="cancel-modal-btn"
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-modal-btn"
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-55"
                >
                  {isLoading ? 'Creating...' : <><Check className="w-4 h-4" /> Save Asset</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
