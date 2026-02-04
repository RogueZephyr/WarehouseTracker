import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { ShiftFormData } from '../shiftUtils';

interface ShiftFormModalProps {
  isOpen: boolean;
  title: string;
  initialShift?: ShiftFormData | null;
  onClose: () => void;
  onSave: (shift: ShiftFormData) => void;
}

const toInputValue = (date?: Date | null) => {
  if (!date) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  isOpen,
  title,
  initialShift,
  onClose,
  onSave,
}) => {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [expectedSmall, setExpectedSmall] = useState(0);
  const [loadedSmall, setLoadedSmall] = useState(0);
  const [expectedLarge, setExpectedLarge] = useState(0);
  const [loadedLarge, setLoadedLarge] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const now = new Date();
    const start = initialShift?.startAt || now;
    const end = initialShift?.endAt || null;

    setStartAt(toInputValue(start));
    setEndAt(toInputValue(end));
    setExpectedSmall(initialShift?.expectedSmall ?? 0);
    setLoadedSmall(initialShift?.loadedSmall ?? 0);
    setExpectedLarge(initialShift?.expectedLarge ?? 0);
    setLoadedLarge(initialShift?.loadedLarge ?? 0);
  }, [isOpen, initialShift]);

  const totals = useMemo(() => {
    const expectedTotal = expectedSmall + expectedLarge;
    const loadedTotal = loadedSmall + loadedLarge;
    const fillRate = expectedTotal > 0 ? (loadedTotal / expectedTotal) * 100 : 0;
    return {
      expectedTotal,
      loadedTotal,
      fillRate: Number(fillRate.toFixed(2)),
    };
  }, [expectedSmall, expectedLarge, loadedSmall, loadedLarge]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!startAt) {
      toast.error('Start time is required');
      return;
    }

    const startDate = new Date(startAt);
    const endDate = endAt ? new Date(endAt) : null;

    if (endDate && endDate < startDate) {
      toast.error('End time must be after start time');
      return;
    }

    onSave({
      id: initialShift?.id,
      startAt: startDate,
      endAt: endDate,
      expectedSmall,
      loadedSmall,
      expectedLarge,
      loadedLarge,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-xl sm:rounded-xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank to keep shift open.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Small Format Volume</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expected</label>
                  <input
                    type="number"
                    min={0}
                    value={expectedSmall}
                    onChange={(e) => setExpectedSmall(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Loaded</label>
                  <input
                    type="number"
                    min={0}
                    value={loadedSmall}
                    onChange={(e) => setLoadedSmall(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Large Format Volume</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expected</label>
                  <input
                    type="number"
                    min={0}
                    value={expectedLarge}
                    onChange={(e) => setExpectedLarge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Loaded</label>
                  <input
                    type="number"
                    min={0}
                    value={loadedLarge}
                    onChange={(e) => setLoadedLarge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-white font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Totals</p>
              <p className="text-sm font-semibold text-gray-900">
                Expected {totals.expectedTotal} · Loaded {totals.loadedTotal}
              </p>
            </div>
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold",
                totals.fillRate >= 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              )}
            >
              Fill {totals.fillRate}%
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3 sm:rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] px-4 py-3 text-white font-bold bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Save Shift
          </button>
        </div>
      </div>
    </div>
  );
};
