import React, { useState } from 'react';
import { Load, LoadStatus } from '../types';
import { getMissingCount } from '../App';
import { StatusBadge } from './StatusBadge';
import { X, Plus, Minus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface LoadDetailModalProps {
  load: Load | null;
  onClose: () => void;
  onUpdate: (updatedLoad: Load) => void;
  onDelete: (id: string) => void;
}

export const LoadDetailModal: React.FC<LoadDetailModalProps> = ({ load, onClose, onUpdate, onDelete }) => {
  const [missingQtyInput, setMissingQtyInput] = useState('1');
  const [missingIdInput, setMissingIdInput] = useState('');
  const [calcInput, setCalcInput] = useState('');

  if (!load) return null;

  const handleIncrement = (amount: number) => {
    const newQty = Math.max(0, load.loadedQty + amount); // Removed min cap to allow corrections, but keep >= 0
    onUpdate({ ...load, loadedQty: newQty });
  };

  const handleCalcSubmit = () => {
    if (!calcInput.trim()) return;

    // Parse addition: "10+5+2"
    const parts = calcInput.split('+');
    let total = 0;
    parts.forEach(p => {
      const val = parseInt(p.trim(), 10);
      if (!isNaN(val)) total += val;
    });

    if (total !== 0) {
      handleIncrement(total);
      setCalcInput('');
    }
  };

  const handleStatusChange = (newStatus: LoadStatus) => {
    let loadedQty = load.loadedQty;
    if (newStatus === 'Complete') {
      loadedQty = Math.max(0, (Number(load.expectedQty) || 0) - getMissingCount(load.missingIds));
    }
    onUpdate({ ...load, status: newStatus, loadedQty });
  };

  const addMissingId = () => {
    if (missingIdInput.trim()) {
      const entry = missingQtyInput !== '1' ? `${missingQtyInput}x ${missingIdInput.trim()}` : missingIdInput.trim();
      onUpdate({
        ...load,
        missingIds: [...load.missingIds, entry]
      });
      setMissingIdInput('');
      setMissingQtyInput('1');
    }
  };

  const toggleNA = () => onUpdate({ ...load, isNA: !load.isNA });
  const toggleFND = () => onUpdate({ ...load, isFND: !load.isFND });

  const removeMissingId = (idToRemove: string) => {
    onUpdate({
      ...load,
      missingIds: load.missingIds.filter(id => id !== idToRemove)
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 sm:rounded-t-xl">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{load.vehicleId}</h2>
              <StatusBadge status={load.status} size="lg" />
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{load.clientName}</span>
              <span>•</span>
              <span>{load.format} Format</span>
              {load.routeCode && (
                <>
                  <span>•</span>
                  <span>Route {load.routeCode}</span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Progress / Quantity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Loading Progress
            </h3>

            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-end justify-between mb-6">
                <div className="text-center flex-1">
                  <div className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-tighter">Loaded</div>
                  <input
                    type="number"
                    value={load.loadedQty}
                    onChange={(e) => onUpdate({ ...load, loadedQty: parseInt(e.target.value, 10) || 0 })}
                    className="w-24 text-center text-4xl font-black text-blue-700 bg-transparent border-b-2 border-blue-200 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div className="text-gray-300 text-3xl font-light pb-1 px-4">/</div>
                <div className="text-center flex-1">
                  <div className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-tighter">Expected</div>
                  <div className="text-4xl font-black text-gray-900">{load.expectedQty}</div>
                </div>
              </div>

              {/* Calculator Style Input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalcSubmit()}
                    placeholder="Add qty (e.g. 10+5)"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-blue-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-lg sm:text-base"
                  />
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                </div>
                <button
                  onClick={handleCalcSubmit}
                  className="px-6 py-3.5 sm:py-0 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-md active:translate-y-0.5 transition-all text-sm uppercase tracking-wider"
                >
                  ADD
                </button>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleIncrement(-1)}
                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors uppercase tracking-widest border border-transparent hover:border-red-100"
                >
                  <Minus className="w-3 h-3" /> Correct Entry (-1)
                </button>
              </div>
            </div>
          </div>

          {/* Missing Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Missing Items
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={toggleNA}
                  title="Not Available"
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-bold border transition-all uppercase tracking-tighter",
                    load.isNA ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  N/A
                </button>
                <button
                  onClick={toggleFND}
                  title="Facturado no despachado"
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-bold border transition-all uppercase tracking-tighter",
                    load.isFND ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-400 border-gray-200 hover:bg-amber-50"
                  )}
                >
                  FND
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="flex gap-2 flex-1">
                  <input
                    type="number"
                    value={missingQtyInput}
                    onChange={(e) => setMissingQtyInput(e.target.value)}
                    placeholder="Qty"
                    className="w-20 px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-lg sm:text-base"
                  />
                  <input
                    value={missingIdInput}
                    onChange={(e) => setMissingIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMissingId()}
                    placeholder="Missing ID or Name..."
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-lg sm:text-base"
                  />
                </div>
                <button
                  onClick={addMissingId}
                  className="px-6 py-3.5 sm:py-0 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm text-sm uppercase tracking-wider"
                >
                  ADD
                </button>
              </div>

              {load.missingIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {load.missingIds.map((id, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                      {id}
                      <button onClick={() => removeMissingId(id)} className="hover:text-orange-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No missing items reported.</p>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Status & Verification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Selector */}
              <div className="p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Current Status</label>
                <select
                  value={load.status}
                  onChange={(e) => handleStatusChange(e.target.value as LoadStatus)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-md font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Process">In Process</option>
                  <option value="Complete">Complete</option>
                  {load.format === 'Large' && <option value="Unverified">Unverified</option>}
                  {load.format === 'Large' && <option value="Verified">Verified</option>}
                </select>
              </div>

              {/* Load Order */}
              <div className="p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Load Order</label>
                <select
                  value={load.loadOrder}
                  onChange={(e) => onUpdate({ ...load, loadOrder: e.target.value as any })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-md font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                >
                  <option value="F">F</option>
                  <option value="MF">MF</option>
                  <option value="M">M</option>
                  <option value="MP">MP</option>
                  <option value="P">P</option>
                </select>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={toggleNA}
                    className={clsx(
                      "flex-1 py-1.5 rounded text-[10px] font-bold border transition-all",
                      load.isNA ? "bg-gray-800 text-white border-gray-800 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    N/A
                  </button>
                  <button
                    onClick={toggleFND}
                    className={clsx(
                      "flex-1 py-1.5 rounded text-[10px] font-bold border transition-all",
                      load.isFND ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:bg-amber-50"
                    )}
                  >
                    FND
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 sm:rounded-b-xl flex justify-between items-center gap-4">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this load?')) {
                onDelete(load.id);
              }
            }}
            className="px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            DELETE
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:translate-y-0.5 sm:w-auto flex-1 sm:flex-none"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
