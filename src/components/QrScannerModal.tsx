import React, { useState, useEffect } from 'react';
import { Camera, QrCode, X, Search, Check, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { Asset } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (assetId: string) => void;
  assets: Asset[];
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess, assets }: QrScannerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualId, setManualId] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScanResult(null);
      setErrorMsg('');
      setManualId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter assets to quickly pick for simulation
  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSimulateScan = (assetId: string) => {
    setIsScanning(false);
    setScanResult(assetId);
    
    // Simulate audio-visual successful scan beep & flash
    setTimeout(() => {
      onScanSuccess(assetId);
      onClose();
    }, 800);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualId.trim().toUpperCase();
    
    const exists = assets.some(a => a.id.toUpperCase() === cleanId);
    if (!exists) {
      setErrorMsg(`Asset with ID "${cleanId}" not found in registry.`);
      return;
    }

    handleSimulateScan(cleanId);
  };

  return (
    <div id="qr-scanner-overlay" className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div id="qr-scanner-card" className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full overflow-hidden animate-scale-up grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Side: Viewfinder Simulator */}
        <div id="qr-viewfinder-pane" className="md:col-span-7 bg-slate-950 p-6 flex flex-col justify-between text-white relative min-h-[360px] md:min-h-[420px]">
          {/* Subtle camera corner guides */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-sm pointer-events-none" />

          {/* Scanner Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">Interactive Cam View</span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-mono bg-blue-500/25 text-blue-400 rounded border border-blue-500/30">LENS ACTIVE</span>
          </div>

          {/* Center Scan Target & Laser line */}
          <div className="flex-1 flex flex-col items-center justify-center relative my-6">
            {isScanning ? (
              <div className="w-48 h-48 border border-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/60 shadow-inner">
                {/* Simulated scan laser */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-bounce-y" />
                
                <QrCode className="w-16 h-16 text-gray-500 opacity-60" />
                <span className="text-[10px] font-mono text-gray-400 mt-3 tracking-wider uppercase text-center px-4">Align barcode or tag inside frame</span>
              </div>
            ) : (
              <div className="w-48 h-48 bg-emerald-500/15 border border-emerald-500 rounded-xl flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-ping-once">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">TAG DECODED</span>
                <span className="text-sm font-semibold text-white mt-1 font-mono">{scanResult}</span>
              </div>
            )}
          </div>

          {/* Bottom Diagnostics / Instruction */}
          <div className="z-10 bg-slate-900/80 border border-white/5 rounded-xl p-3 text-xs text-gray-300">
            <div className="flex items-center gap-1 text-blue-400 font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>How to test:</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Use the simulator panel on the right to click any asset ID. This replicates scanning a physical QR code or barcode tag on the actual machinery.
            </p>
          </div>
        </div>

        {/* Right Side: Control & Simulator Panel */}
        <div id="qr-control-pane" className="md:col-span-5 p-6 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900 leading-none">QR Code Triage</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 leading-normal">
              Scan or enter an asset serial tag to view instant specifications, maintenance logs, or immediately log an issue.
            </p>

            {/* Manual input */}
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manual Code Entry</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AST-101"
                  value={manualId}
                  onChange={(e) => { setManualId(e.target.value); setErrorMsg(''); }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono placeholder-gray-400 text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Decode
                </button>
              </div>
              {errorMsg && (
                <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </form>
          </div>

          {/* Quick Select Simulation list */}
          <div className="space-y-2 flex-1 flex flex-col min-h-[180px]">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Click to Simulate Scan</span>
            
            {/* Search list */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search demo assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1 border border-gray-100 rounded-md text-[11px] focus:outline-hidden"
              />
            </div>

            {/* List box */}
            <div className="flex-1 overflow-y-auto max-h-[160px] border border-gray-100 rounded-lg divide-y divide-gray-50 text-xs">
              {filteredAssets.length === 0 ? (
                <p className="p-3 text-center text-[11px] text-gray-400">No assets found</p>
              ) : (
                filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => handleSimulateScan(asset.id)}
                    className="w-full text-left p-2.5 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-semibold text-blue-600">{asset.id}</span>
                      <p className="font-semibold text-gray-800 truncate leading-tight mt-0.5">{asset.name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-700">
                      Scan tag
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Maintix Barcode Engine v1.02</span>
          </div>

        </div>

      </div>
    </div>
  );
}
