import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import { QrCode, Printer, Layers, Grid, Palette, Ruler, Check, HelpCircle, FileText, AlertTriangle, PhoneCall } from 'lucide-react';

interface QrGeneratorProps {
  assets: Asset[];
}

interface TagTemplate {
  id: string;
  name: string;
  model: string;
  serial: string;
  category: string;
  instructions: string;
  contactPhone: string;
  colorTheme: 'slate' | 'caution' | 'safety' | 'blue' | 'black';
  size: 'small' | 'medium' | 'large';
  showBorders: boolean;
}

export default function QrGenerator({ assets }: QrGeneratorProps) {
  // State for single tag generation
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [customTag, setCustomTag] = useState<TagTemplate>({
    id: 'AST-TEMP-99',
    name: 'Main Intake Water Pressure Pump',
    model: 'Pentair Intelliflo 300G',
    serial: 'SN-09381-PNT',
    category: 'Plumbing / Infrastructure',
    instructions: 'Always isolate circuit breaker before opening valve assembly.',
    contactPhone: '+1 (555) 902-8811',
    colorTheme: 'slate',
    size: 'medium',
    showBorders: true,
  });

  // State for multi-asset batch generation
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(assets.slice(0, 4).map(a => a.id));
  const [batchTheme, setBatchTheme] = useState<TagTemplate['colorTheme']>('slate');
  const [batchSize, setBatchSize] = useState<TagTemplate['size']>('medium');
  const [batchInstructions, setBatchInstructions] = useState('Inspect daily. Lockout power before maintenance.');
  const [batchPhone, setBatchPhone] = useState('+1 (555) 382-9901');

  // Tab state: 'single' or 'batch'
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch'>('single');

  const assetMap = React.useMemo(() => {
    return new Map(assets.map(a => [a.id, a]));
  }, [assets]);

  // Sync state when asset is selected
  const handleAssetSelectChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = assetMap.get(assetId);
    if (asset) {
      setCustomTag(prev => ({
        ...prev,
        id: asset.id,
        name: asset.name,
        model: asset.model,
        serial: asset.serialNumber,
        category: asset.category,
      }));
    }
  };

  const handleCustomFieldChange = (field: keyof TagTemplate, value: any) => {
    setCustomTag(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle asset in batch selection
  const toggleBatchAsset = (assetId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Get color styles based on selected theme
  const getThemeStyles = (theme: TagTemplate['colorTheme']) => {
    switch (theme) {
      case 'caution':
        return {
          primary: 'border-amber-500 bg-amber-50/20',
          header: 'bg-amber-500 text-amber-950 border-amber-600',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          idText: 'text-amber-700',
          accent: 'amber'
        };
      case 'safety':
        return {
          primary: 'border-orange-500 bg-orange-50/20',
          header: 'bg-orange-500 text-white border-orange-600',
          badge: 'bg-orange-100 text-orange-800 border-orange-300',
          idText: 'text-orange-700',
          accent: 'orange'
        };
      case 'blue':
        return {
          primary: 'border-blue-600 bg-blue-50/20',
          header: 'bg-blue-600 text-white border-blue-700',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          idText: 'text-blue-600',
          accent: 'blue'
        };
      case 'black':
        return {
          primary: 'border-zinc-900 bg-zinc-50',
          header: 'bg-zinc-950 text-white border-zinc-950',
          badge: 'bg-zinc-200 text-zinc-900 border-zinc-300',
          idText: 'text-zinc-950',
          accent: 'zinc'
        };
      case 'slate':
      default:
        return {
          primary: 'border-slate-800 bg-slate-50/30',
          header: 'bg-slate-800 text-slate-100 border-slate-900',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          idText: 'text-slate-700',
          accent: 'slate'
        };
    }
  };

  // Dimensions based on size selected
  const getSizeStyles = (size: TagTemplate['size']) => {
    switch (size) {
      case 'small':
        return {
          cardWidth: 'w-64',
          qrSize: '64x64',
          qrClass: 'w-16 h-16',
          padding: 'p-3',
          fontSize: 'text-[11px]'
        };
      case 'large':
        return {
          cardWidth: 'w-96',
          qrSize: '150x150',
          qrClass: 'w-28 h-28',
          padding: 'p-6',
          fontSize: 'text-sm'
        };
      case 'medium':
      default:
        return {
          cardWidth: 'w-80',
          qrSize: '100x100',
          qrClass: 'w-24 h-24',
          padding: 'p-5',
          fontSize: 'text-xs'
        };
    }
  };

  // Trigger Print for Single Tag
  const handlePrintSingle = () => {
    const themeStyles = getThemeStyles(customTag.colorTheme);
    const sizeStyles = getSizeStyles(customTag.size);
    const themeColorHex = 
      customTag.colorTheme === 'caution' ? 'f59e0b' :
      customTag.colorTheme === 'safety' ? 'f97316' :
      customTag.colorTheme === 'blue' ? '2563eb' :
      customTag.colorTheme === 'black' ? '09090b' : '1e293b';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Maintix Physical Tag - ${customTag.id}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 80vh;
                background-color: #ffffff;
              }
              .tag-card {
                width: ${customTag.size === 'small' ? '240px' : customTag.size === 'large' ? '360px' : '300px'};
                border: 2px solid #${themeColorHex};
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .header {
                background-color: #${themeColorHex};
                color: ${customTag.colorTheme === 'caution' ? '#451a03' : '#ffffff'};
                padding: 12px 16px;
                text-align: center;
                font-weight: 800;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
              }
              .body {
                padding: 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                background-color: #ffffff;
              }
              .title {
                font-weight: 800;
                font-size: 15px;
                color: #0f172a;
                text-align: center;
                margin: 0 0 4px 0;
              }
              .spec {
                font-size: 11px;
                color: #64748b;
                font-family: monospace;
                margin-bottom: 12px;
                text-align: center;
              }
              .qr-container {
                padding: 8px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 12px;
              }
              .qr-img {
                width: ${customTag.size === 'small' ? '90px' : customTag.size === 'large' ? '160px' : '120px'};
                height: ${customTag.size === 'small' ? '90px' : customTag.size === 'large' ? '160px' : '120px'};
              }
              .id {
                font-family: monospace;
                font-size: 20px;
                font-weight: bold;
                color: #2563eb;
                margin: 4px 0;
                letter-spacing: 1.5px;
              }
              .category {
                font-size: 10px;
                background-color: #f1f5f9;
                color: #475569;
                border: 1px solid #cbd5e1;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 12px;
              }
              .safety-block {
                font-size: 10px;
                color: #7f1d1d;
                background-color: #fef2f2;
                border: 1px solid #fee2e2;
                padding: 8px;
                border-radius: 6px;
                text-align: center;
                width: 100%;
                box-sizing: border-box;
                font-weight: 500;
              }
              .contact {
                font-size: 9px;
                color: #64748b;
                margin-top: 10px;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="tag-card">
              <div class="header">MAINTIX ASSET SYSTEM</div>
              <div class="body">
                <div class="title">${customTag.name}</div>
                <div class="spec">${customTag.model} • S/N ${customTag.serial}</div>
                <div class="qr-container">
                  <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(customTag.id)}&color=0f172a&bgcolor=ffffff" />
                </div>
                <div class="id">${customTag.id}</div>
                <div class="category">${customTag.category}</div>
                ${customTag.instructions ? `<div class="safety-block">⚠️ HAZARD: ${customTag.instructions}</div>` : ''}
                ${customTag.contactPhone ? `<div class="contact">EMERGENCY DISPATCH: ${customTag.contactPhone}</div>` : ''}
              </div>
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
    }
  };

  // Trigger Print for Batch Sticker Sheet
  const handlePrintBatch = () => {
    if (selectedBatchIds.length === 0) return;
    const themeColorHex = 
      batchTheme === 'caution' ? 'f59e0b' :
      batchTheme === 'safety' ? 'f97316' :
      batchTheme === 'blue' ? '2563eb' :
      batchTheme === 'black' ? '09090b' : '1e293b';

    const printItems = selectedBatchIds.map(id => {
      const asset = assetMap.get(id);
      return {
        id,
        name: asset?.name || 'Unknown Asset',
        model: asset?.model || 'Generic Model',
        serial: asset?.serialNumber || 'SN-UNKNOWN',
        category: asset?.category || 'General',
      };
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Maintix Batch Sticker Sheet</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #ffffff;
              }
              .page-title {
                font-size: 14px;
                color: #94a3b8;
                font-family: monospace;
                border-bottom: 1px dashed #e2e8f0;
                padding-bottom: 8px;
                margin-bottom: 24px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .tag-card {
                border: 2px solid #${themeColorHex};
                border-radius: 12px;
                overflow: hidden;
                box-sizing: border-box;
                background-color: #ffffff;
                page-break-inside: avoid;
              }
              .header {
                background-color: #${themeColorHex};
                color: ${batchTheme === 'caution' ? '#451a03' : '#ffffff'};
                padding: 10px 14px;
                text-align: center;
                font-weight: 800;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
              }
              .body {
                padding: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .title {
                font-weight: 800;
                font-size: 13px;
                color: #0f172a;
                text-align: center;
                margin: 0 0 3px 0;
              }
              .spec {
                font-size: 10px;
                color: #64748b;
                font-family: monospace;
                margin-bottom: 8px;
                text-align: center;
              }
              .qr-container {
                padding: 6px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                margin-bottom: 8px;
              }
              .qr-img {
                width: 100px;
                height: 100px;
              }
              .id {
                font-family: monospace;
                font-size: 16px;
                font-weight: bold;
                color: #2563eb;
                margin: 2px 0;
                letter-spacing: 1px;
              }
              .category {
                font-size: 9px;
                background-color: #f1f5f9;
                color: #475569;
                border: 1px solid #cbd5e1;
                padding: 1px 6px;
                border-radius: 3px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .safety-block {
                font-size: 9px;
                color: #7f1d1d;
                background-color: #fef2f2;
                border: 1px solid #fee2e2;
                padding: 6px;
                border-radius: 4px;
                text-align: center;
                width: 100%;
                box-sizing: border-box;
                font-weight: 500;
              }
              .contact {
                font-size: 8px;
                color: #64748b;
                margin-top: 8px;
                font-weight: 600;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .page-title {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="page-title">Maintix System • Printable Sticker Grid Sheet</div>
            <div class="grid-container">
              ${printItems.map(item => `
                <div class="tag-card">
                  <div class="header">MAINTIX ASSET SYSTEM</div>
                  <div class="body">
                    <div class="title">${item.name}</div>
                    <div class="spec">${item.model} • S/N ${item.serial}</div>
                    <div class="qr-container">
                      <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.id)}&color=0f172a&bgcolor=ffffff" />
                    </div>
                    <div class="id">${item.id}</div>
                    <div class="category">${item.category}</div>
                    ${batchInstructions ? `<div class="safety-block">⚠️ HAZARD: ${batchInstructions}</div>` : ''}
                    ${batchPhone ? `<div class="contact">EMERGENCY DISPATCH: ${batchPhone}</div>` : ''}
                  </div>
                </div>
              `).join('')}
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
    }
  };

  const themeStyles = getThemeStyles(customTag.colorTheme);
  const sizeStyles = getSizeStyles(customTag.size);

  return (
    <div id="qr-utility-view" className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div id="qr-utility-header" className="flex items-center justify-between">
        <div id="qr-title-block">
          <h1 className="font-display font-bold text-3xl text-gray-900 tracking-tight">QR Tag & Barcode Utility</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate, customize, and batch-print hardware tag labels to enable quick on-site diagnostic lookup.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex border border-gray-200 bg-white rounded-xl p-1 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('single')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'single' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Single Label
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('batch')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'batch' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Batch Print Sheet
          </button>
        </div>
      </div>

      {activeSubTab === 'single' ? (
        /* Single Tag Generator */
        <div id="single-generator-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Panel (Left 7 Columns) */}
          <div id="single-settings-panel" className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-6">
            <h2 className="font-display font-bold text-base text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Label Configuration Parameters</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Asset Link */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Link with Registered Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetSelectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Customize Tag Manually --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.id} - {asset.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Linking auto-populates serial codes and telemetry indicators.</p>
              </div>

              {/* Tag Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Asset Tag Label ID</label>
                  <input
                    type="text"
                    value={customTag.id}
                    onChange={(e) => handleCustomFieldChange('id', e.target.value)}
                    placeholder="e.g. AST-901"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Asset/Equipment Name</label>
                  <input
                    type="text"
                    value={customTag.name}
                    onChange={(e) => handleCustomFieldChange('name', e.target.value)}
                    placeholder="e.g. Pentair Pressure Valve"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hardware Model Number</label>
                  <input
                    type="text"
                    value={customTag.model}
                    onChange={(e) => handleCustomFieldChange('model', e.target.value)}
                    placeholder="e.g. Pentair Intelliflo"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Manufacturer Serial Number</label>
                  <input
                    type="text"
                    value={customTag.serial}
                    onChange={(e) => handleCustomFieldChange('serial', e.target.value)}
                    placeholder="e.g. SN-0982-PN"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Theme Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-gray-500" /> Style / Color Scheme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['slate', 'caution', 'safety', 'blue', 'black'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => handleCustomFieldChange('colorTheme', t)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          customTag.colorTheme === t
                            ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-gray-500" /> Physical Dimension Size
                  </label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleCustomFieldChange('size', s)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold capitalize transition-all flex-1 cursor-pointer ${
                          customTag.size === s
                            ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hazard / Safety Warning Block */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5" /> Hazard Instruction Warning
                </label>
                <input
                  type="text"
                  value={customTag.instructions}
                  onChange={(e) => handleCustomFieldChange('instructions', e.target.value)}
                  placeholder="Specify operating hazard instructions (e.g. Lockout tagout before inspection)"
                  className="w-full px-3 py-2 border border-red-100 hover:border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-red-50/5 text-red-950 font-medium placeholder-red-300"
                />
              </div>

              {/* Emergency dispatch contact phone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 text-blue-600">
                  <PhoneCall className="w-3.5 h-3.5" /> Emergency Dispatch Callback
                </label>
                <input
                  type="text"
                  value={customTag.contactPhone}
                  onChange={(e) => handleCustomFieldChange('contactPhone', e.target.value)}
                  placeholder="Contact telephone or department extension"
                  className="w-full px-3 py-2 border border-blue-100 hover:border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/5 text-blue-950 font-medium placeholder-blue-300"
                />
              </div>
            </div>

            {/* Print trigger action */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handlePrintSingle}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Label Sticker
              </button>
            </div>
          </div>

          {/* Live Preview Panel (Right 5 Columns) */}
          <div id="single-preview-panel" className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl p-8 min-h-[500px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-4">
              ✨ Live Sticker Preview (Actual Render)
            </span>

            {/* Physical sticker look card */}
            <div
              className={`bg-white rounded-2xl border-2 overflow-hidden shadow-md transition-all flex flex-col ${sizeStyles.cardWidth} ${themeStyles.primary}`}
            >
              {/* Sticker Header Bar */}
              <div className={`py-3 px-4 text-center border-b font-display font-black text-[10px] tracking-widest uppercase ${themeStyles.header}`}>
                MAINTIX ASSET SYSTEM
              </div>

              {/* Sticker Body */}
              <div className="p-5 flex flex-col items-center">
                <h3 className="font-sans font-extrabold text-gray-900 text-center leading-tight tracking-tight text-sm">
                  {customTag.name || 'Untitled Asset'}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5 text-center truncate w-full">
                  {customTag.model || 'Unknown Model'} • S/N {customTag.serial || 'Unknown'}
                </p>

                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 my-4 shadow-3xs flex items-center justify-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(customTag.id)}&color=0f172a&bgcolor=ffffff`}
                    alt="Sticker QR"
                    className={`${sizeStyles.qrClass}`}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Tag unique ID */}
                <span className={`font-mono text-lg font-bold tracking-wider mb-1 block ${themeStyles.idText}`}>
                  {customTag.id || 'AST-TEMP'}
                </span>

                {/* Category block badge */}
                <span className="px-2 py-0.5 border border-gray-200 rounded bg-gray-50 text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-3 block">
                  {customTag.category || 'General'}
                </span>

                {/* Hazard block */}
                {customTag.instructions && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg text-[9px] font-semibold flex items-start gap-1.5 leading-relaxed text-left w-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>HAZARD: {customTag.instructions}</span>
                  </div>
                )}

                {/* Callback phone */}
                {customTag.contactPhone && (
                  <div className="text-[8px] text-gray-400 font-bold tracking-wide mt-2 flex items-center gap-1 font-mono uppercase">
                    <PhoneCall className="w-3 h-3 text-blue-500" />
                    <span>DISPATCH: {customTag.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center max-w-xs mt-6 leading-relaxed">
              Tag dimensions conform to <strong>3" x 3" standard thermal sticker roll sizes</strong>. Ready to feed directly into Zebra, Brother, or DYMO hardware.
            </p>
          </div>
        </div>
      ) : (
        /* Batch Sticker Sheet Grid Generator */
        <div id="batch-generator-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Panel (Left 4 Columns) */}
          <div id="batch-settings-panel" className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-xs">
            <h2 className="font-display font-bold text-sm text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-600" />
              <span>Sticker Sheet Control</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Batch Select list */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Assets to Bulk Generate</label>
                <div className="border border-gray-150 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-100 bg-gray-50">
                  {assets.map(asset => {
                    const isChecked = selectedBatchIds.includes(asset.id);
                    return (
                      <label key={asset.id} className="flex items-center gap-3 p-2.5 hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBatchAsset(asset.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-[10px] text-blue-600 block">{asset.id}</span>
                          <span className="font-semibold text-gray-800 text-[11px] truncate block">{asset.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-[10px] font-semibold text-gray-400">{selectedBatchIds.length} Assets selected</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchIds(assets.map(a => a.id))}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBatchIds([])}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>
              </div>

              {/* Batch Theme & Size */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Batch Theme Style</label>
                  <select
                    value={batchTheme}
                    onChange={(e) => setBatchTheme(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg cursor-pointer"
                  >
                    <option value="slate">Slate Modern</option>
                    <option value="caution">Caution Amber</option>
                    <option value="safety">Safety Orange</option>
                    <option value="blue">Industrial Blue</option>
                    <option value="black">Brutalist Black</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Shared Warning Text</label>
                  <input
                    type="text"
                    value={batchInstructions}
                    onChange={(e) => setBatchInstructions(e.target.value)}
                    placeholder="Shared Hazard or Operating guideline text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dispatch Call Number</label>
                  <input
                    type="text"
                    value={batchPhone}
                    onChange={(e) => setBatchPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={selectedBatchIds.length === 0}
                onClick={handlePrintBatch}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Sheet Grid
              </button>
            </div>
          </div>

          {/* Grid Preview Sheet (Right 8 Columns) */}
          <div id="batch-preview-sheet" className="lg:col-span-8 bg-gray-50 border border-gray-200 rounded-2xl p-6 min-h-[500px]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                📄 Sheet Layout Preview ({selectedBatchIds.length} stickers grid)
              </span>
              <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
                LETTER SIZE ROLL
              </span>
            </div>

            {selectedBatchIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <Layers className="w-10 h-10 text-gray-300" />
                <p className="text-xs font-semibold text-gray-500">No assets selected for batch print sheet</p>
                <p className="text-[11px] text-gray-400">Please choose assets from the left control pane</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {selectedBatchIds.map(id => {
                  const asset = assetMap.get(id);
                  const themeColors = getThemeStyles(batchTheme);
                  return (
                    <div
                      key={id}
                      className={`bg-white rounded-xl border-2 overflow-hidden flex flex-col text-[10px] shadow-2xs hover:shadow-xs transition-shadow ${themeColors.primary}`}
                    >
                      {/* Header */}
                      <div className={`py-1.5 px-3 text-center border-b font-display font-black text-[9px] tracking-widest uppercase ${themeColors.header}`}>
                        MAINTIX SYSTEM
                      </div>

                      {/* Body */}
                      <div className="p-3.5 flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-center leading-tight truncate w-full block">
                          {asset?.name || 'Unknown Asset'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5 block truncate w-full text-center">
                          {asset?.model || 'Generic Model'} • S/N {asset?.serialNumber || 'SN-UNKNOWN'}
                        </span>

                        {/* Tiny QR Code */}
                        <div className="bg-white p-1 rounded-lg border border-gray-150 my-2 shadow-4xs shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(id)}&color=0f172a&bgcolor=ffffff`}
                            alt="Sticker QR"
                            className="w-14 h-14"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* ID */}
                        <span className={`font-mono text-xs font-extrabold tracking-wide mb-1 ${themeColors.idText}`}>
                          {id}
                        </span>

                        {/* Hazard */}
                        {batchInstructions && (
                          <div className="bg-red-50 border border-red-100 text-red-800 p-1 rounded text-[8px] font-medium leading-relaxed text-center w-full mt-1">
                            {batchInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
