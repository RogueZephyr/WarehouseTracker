import React, { useState } from 'react';
import { Load, LoadStatus } from '../types';
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
  const [missingInput, setMissingInput] = useState('');

  if (!load) return null;

  const handleIncrement = (amount: number) => {
    const newQty = Math.min(load.loadedQty + amount, load.expectedQty);
    onUpdate({ ...load, loadedQty: newQty });
  };

  const handleDecrement = (amount: number) => {
    const newQty = Math.max(load.loadedQty - amount, 0);
    onUpdate({ ...load, loadedQty: newQty });
  };

  const handleStatusChange = (newStatus: LoadStatus) => {
    onUpdate({ ...load, status: newStatus });
  };

  const addMissingId = () => {
    if (missingInput.trim()) {
      onUpdate({
        ...load,
        missingIds: [...load.missingIds, missingInput.trim()]
      });
      setMissingInput('');
    }
  };

  const removeMissingId = (idToRemove: string) => {
    onUpdate({
      ...load,
      missingIds: load.missingIds.filter(id => id !== idToRemove)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
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
              <div className="flex items-end justify-between mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">Loaded</div>
                  <div className="text-4xl font-bold text-blue-700">{load.loadedQty}</div>
                </div>
                <div className="text-gray-300 text-3xl font-light">/</div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 font-medium mb-1">Expected</div>
                  <div className="text-4xl font-bold text-gray-900">{load.expectedQty}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleIncrement(1)}
                  className="py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold shadow-sm hover:bg-blue-50 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 1
                </button>
                <button
                  onClick={() => handleIncrement(5)}
                  className="py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold shadow-sm hover:bg-blue-50 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 5
                </button>
                <button
                  onClick={() => handleIncrement(10)}
                  className="py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold shadow-sm hover:bg-blue-50 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 10
                </button>
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => handleDecrement(1)}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Minus className="w-3 h-3" /> Correct Entry (-1)
                </button>
              </div>
            </div>
          </div>

          {/* Missing Items Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Missing Items
            </h3>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex gap-2 mb-4">
                <input
                  value={missingInput}
                  onChange={(e) => setMissingInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMissingId()}
                  placeholder="Enter Missing ID..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <button
                  onClick={addMissingId}
                  className="px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700"
                >
                  Add
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
                  className="w-full p-2 bg-white border border-gray-300 rounded-md font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="F">F</option>
                  <option value="MF">MF</option>
                  <option value="M">M</option>
                  <option value="MP">MP</option>
                  <option value="P">P</option>
                </select>
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
