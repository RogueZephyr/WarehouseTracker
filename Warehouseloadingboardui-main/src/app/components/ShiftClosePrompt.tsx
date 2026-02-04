import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Shift } from '../types';

interface ShiftClosePromptProps {
  shift: Shift | null;
  warehouseTimeZone: string;
  onDismiss: () => void;
  onCloseShift: (shiftId: string, endAtIso: string) => void;
}

const toInputValue = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

export const ShiftClosePrompt: React.FC<ShiftClosePromptProps> = ({
  shift,
  warehouseTimeZone,
  onDismiss,
  onCloseShift,
}) => {
  const [closeAt, setCloseAt] = useState('');

  useEffect(() => {
    if (!shift) return;
    setCloseAt(toInputValue(new Date()));
  }, [shift]);

  if (!shift) return null;

  const handleClose = () => {
    if (!closeAt) {
      toast.error('Please set a close time');
      return;
    }

    const closeDate = new Date(closeAt);
    if (closeDate < shift.startAt) {
      toast.error('Close time must be after start time');
      return;
    }

    onCloseShift(shift.id, closeDate.toISOString());
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shift open over 12 hours</h2>
              <p className="text-sm text-gray-500">Please close this shift and confirm the correct end time.</p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Shift start</span>
              <span className="font-semibold text-gray-900">{shift.startAt.toLocaleString('en-US', { timeZone: warehouseTimeZone })}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-500">Duration</span>
              <span className="font-semibold text-gray-900">{shift.durationHours.toFixed(1)} hrs</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Close time (date & time)</label>
            <input
              type="datetime-local"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3 sm:rounded-b-xl">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-3 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Later
          </button>
          <button
            onClick={handleClose}
            className="flex-[2] px-4 py-3 text-white font-bold bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  );
};
