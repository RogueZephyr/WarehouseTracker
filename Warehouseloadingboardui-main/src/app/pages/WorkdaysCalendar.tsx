import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Shift } from '../types';
import { ShiftFormModal } from '../components/ShiftFormModal';
import { ShiftFormData, toFrontendShift, toShiftPayload } from '../shiftUtils';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

interface WorkdaysCalendarProps {
  warehouseTimeZone: string;
  onNavigateBoard: () => void;
  onActivateShift?: (shiftId: string) => void;
}

interface DaySummary {
  workday: string;
  date: Date;
  shifts: Shift[];
  expectedSmall: number;
  loadedSmall: number;
  expectedLarge: number;
  loadedLarge: number;
  expectedTotal: number;
  loadedTotal: number;
  fillRate: number;
}

const formatWorkday = (date: Date) => format(date, 'yyyy-MM-dd');

export const WorkdaysCalendar: React.FC<WorkdaysCalendarProps> = ({
  warehouseTimeZone,
  onNavigateBoard,
  onActivateShift,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workedOnly, setWorkedOnly] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(formatWorkday(new Date()));
  const [loading, setLoading] = useState(false);
  const [creatingShift, setCreatingShift] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [autoCreatedShiftId, setAutoCreatedShiftId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return { start, end };
    }

    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return { start, end };
  }, [viewMode, currentDate]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const start = format(range.start, 'yyyy-MM-dd');
      const end = format(range.end, 'yyyy-MM-dd');
      const res = await fetch(`/api/shifts/?start=${start}&end=${end}&include_open=true`);
      if (!res.ok) throw new Error('Failed to fetch shifts');
      const data = await res.json();
      setShifts(data.map(toFrontendShift));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [range.start.getTime(), range.end.getTime()]);

  useEffect(() => {
    const selectedDate = new Date(selectedDay + 'T00:00:00');
    if (selectedDate < range.start || selectedDate > range.end) {
      setSelectedDay(formatWorkday(range.start));
    }
  }, [range.start, range.end, selectedDay]);

  const daySummaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    shifts.filter((shift) => shift.status === 'closed').forEach((shift) => {
      const workday = shift.workday;
      const date = new Date(workday + 'T00:00:00');
      const entry = map.get(workday) || {
        workday,
        date,
        shifts: [],
        expectedSmall: 0,
        loadedSmall: 0,
        expectedLarge: 0,
        loadedLarge: 0,
        expectedTotal: 0,
        loadedTotal: 0,
        fillRate: 0,
      };

      entry.shifts.push(shift);
      entry.expectedSmall += shift.expectedSmall;
      entry.loadedSmall += shift.loadedSmall;
      entry.expectedLarge += shift.expectedLarge;
      entry.loadedLarge += shift.loadedLarge;
      entry.expectedTotal = entry.expectedSmall + entry.expectedLarge;
      entry.loadedTotal = entry.loadedSmall + entry.loadedLarge;
      entry.fillRate = entry.expectedTotal > 0
        ? Number(((entry.loadedTotal / entry.expectedTotal) * 100).toFixed(2))
        : 0;

      map.set(workday, entry);
    });

    return map;
  }, [shifts]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach((shift) => {
      const list = map.get(shift.workday) || [];
      list.push(shift);
      map.set(shift.workday, list);
    });
    return map;
  }, [shifts]);

  const days = useMemo(() => {
    const list: Date[] = [];
    let day = range.start;
    while (day <= range.end) {
      list.push(day);
      day = addDays(day, 1);
    }
    return list;
  }, [range.start, range.end]);

  const selectedSummary = daySummaries.get(selectedDay) || null;
  const selectedShifts = shiftsByDay.get(selectedDay) || [];
  const selectedHasOpen = selectedShifts.some((shift) => shift.status === 'open');

  const openShiftBoard = (shiftId: string) => {
    if (!onActivateShift) return;
    onActivateShift(shiftId);
    onNavigateBoard();
  };


  const weekTotals = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const totals = {
      expectedSmall: 0,
      loadedSmall: 0,
      expectedLarge: 0,
      loadedLarge: 0,
      expectedTotal: 0,
      loadedTotal: 0,
      fillRate: 0,
    };

    let day = start;
    while (day <= end) {
      const key = formatWorkday(day);
      const summary = daySummaries.get(key);
      if (summary) {
        totals.expectedSmall += summary.expectedSmall;
        totals.loadedSmall += summary.loadedSmall;
        totals.expectedLarge += summary.expectedLarge;
        totals.loadedLarge += summary.loadedLarge;
      }
      day = addDays(day, 1);
    }

    totals.expectedTotal = totals.expectedSmall + totals.expectedLarge;
    totals.loadedTotal = totals.loadedSmall + totals.loadedLarge;
    totals.fillRate = totals.expectedTotal > 0
      ? Number(((totals.loadedTotal / totals.expectedTotal) * 100).toFixed(2))
      : 0;

    return totals;
  }, [currentDate, daySummaries]);

  const handlePrev = () => {
    setCurrentDate((prev) => (viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)));
  };

  const openCreateShift = async () => {
    try {
      setCreatingShift(true);
      const res = await fetch('/api/shifts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_at: new Date().toISOString(),
          status: 'open',
          expected_small: 0,
          loaded_small: 0,
          expected_large: 0,
          loaded_large: 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create shift');
      const created = await res.json();
      const savedShift = toFrontendShift(created);
      await fetchShifts();
      setEditingShift(savedShift);
      setAutoCreatedShiftId(savedShift.id);
      setFormOpen(true);
      onActivateShift?.(savedShift.id);
      toast.success('Shift created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create shift');
    } finally {
      setCreatingShift(false);
    }
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setFormOpen(true);
  };

  const handleSaveShift = async (formData: ShiftFormData) => {
    try {
      const payload = toShiftPayload(formData);
      const res = await fetch(
        formData.id ? `/api/shifts/${formData.id}/` : '/api/shifts/',
        {
          method: formData.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Failed to save shift');
      const saved = await res.json();
      const savedShift = toFrontendShift(saved);
      await fetchShifts();
      toast.success('Shift saved');
      setFormOpen(false);

      if (!formData.endAt && savedShift?.id) {
        if (!formData.id || savedShift.id === autoCreatedShiftId) {
          onActivateShift?.(savedShift.id);
          onNavigateBoard();
        }
      }

      if (savedShift?.id === autoCreatedShiftId) {
        setAutoCreatedShiftId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save shift');
    }
  };

  const handleCloseForm = () => {
    if (editingShift?.id === autoCreatedShiftId) {
      setAutoCreatedShiftId(null);
    }
    setEditingShift(null);
    setFormOpen(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete shift');
      await fetchShifts();
      toast.success('Shift deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete shift');
    }
  };

  const viewLabel = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d')}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateBoard}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Back to board"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Workdays Calendar</h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 font-medium">
                <CalendarDays className="w-3 h-3" />
                <span>{viewLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-xs text-gray-500">Worked only</span>
              <Switch checked={workedOnly} onCheckedChange={setWorkedOnly} />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('month')}
                className={clsx(
                  'px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors',
                  viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                )}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={clsx(
                  'px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors',
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                )}
              >
                Week
              </button>
            </div>
            <button
              onClick={openCreateShift}
              disabled={creatingShift}
              className={clsx(
                "flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg w-full sm:w-auto",
                creatingShift ? "bg-blue-300 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Plus className="w-4 h-4" /> New Shift
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-xs text-gray-500">Worked only</span>
            <Switch checked={workedOnly} onCheckedChange={setWorkedOnly} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
            <div className="grid grid-cols-7 text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em] sm:tracking-widest mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {days.map((day) => {
                const workday = formatWorkday(day);
                const summary = daySummaries.get(workday);
                const dayShifts = shiftsByDay.get(workday) || [];
                const openCount = dayShifts.filter((shift) => shift.status === 'open').length;
                const isWorked = !!summary;
                const isSelected = selectedDay === workday;
                const muted = !isSameMonth(day, currentDate);

                if (workedOnly && !isWorked) {
                  return (
                    <div
                      key={workday}
                      className={clsx(
                        'h-16 sm:h-24 rounded-lg border border-dashed border-gray-200 bg-gray-50/40 text-gray-300 flex items-center justify-center text-[11px] sm:text-xs',
                        muted && 'opacity-40'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                }

                return (
                  <button
                    key={workday}
                    onClick={() => setSelectedDay(workday)}
                    className={clsx(
                      'h-16 sm:h-24 rounded-lg border text-left p-2 flex flex-col justify-between transition-colors',
                      isWorked
                        ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                      : openCount > 0
                        ? 'border-blue-100 bg-white hover:bg-blue-50/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50',
                    isSelected && 'ring-2 ring-blue-500',
                    muted && 'opacity-60'
                  )}
                  >
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-700">{format(day, 'd')}</span>
                    {summary ? (
                      <div className="space-y-1">
                        <div className="text-[9px] sm:text-[10px] text-gray-500">{summary.shifts.length} shift{summary.shifts.length !== 1 ? 's' : ''}</div>
                        <div className={clsx(
                          'text-[11px] sm:text-xs font-bold',
                          summary.fillRate >= 100 ? 'text-green-700' : 'text-amber-700'
                        )}>
                          {summary.fillRate}% fill
                        </div>
                      </div>
                    ) : openCount > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[9px] sm:text-[10px] text-blue-600 font-semibold">{openCount} open</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-400">In progress</div>
                      </div>
                    ) : (
                      <span className="hidden sm:block text-[10px] text-gray-300">No shifts</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Selected day</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{format(new Date(selectedDay + 'T00:00:00'), 'MMM d, yyyy')}</p>
              </div>
              <span className="text-xs text-gray-400">{warehouseTimeZone}</span>
            </div>

            {(selectedSummary || selectedShifts.length > 0) ? (
              <div className="space-y-3">
                {selectedSummary ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected</span>
                      <span className="font-semibold">{selectedSummary.expectedTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loaded</span>
                      <span className="font-semibold">{selectedSummary.loadedTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fill rate</span>
                      <span className={clsx(
                        'font-semibold',
                        selectedSummary.fillRate >= 100 ? 'text-green-700' : 'text-amber-700'
                      )}>
                        {selectedSummary.fillRate}%
                      </span>
                    </div>
                  </div>
                ) : selectedHasOpen ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 text-sm text-blue-700">
                    Open shifts in progress — totals will appear once closed.
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Shifts</h3>
                  <span className="text-xs text-gray-400">{selectedShifts.length} total</span>
                </div>

                <div className="space-y-3">
                  {selectedShifts.map((shift) => (
                    <div key={shift.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{shift.startAt.toLocaleString('en-US', { timeZone: warehouseTimeZone })}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {shift.endAt
                              ? shift.endAt.toLocaleString('en-US', { timeZone: warehouseTimeZone })
                              : 'Open'}
                          </p>
                        </div>
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-[10px] font-bold',
                          shift.status === 'open'
                            ? 'bg-blue-50 text-blue-700'
                            : shift.fillRate >= 100
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                        )}>
                          {shift.status === 'open' ? 'Open' : `${shift.fillRate}%`}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Small {shift.loadedSmall}/{shift.expectedSmall} · Large {shift.loadedLarge}/{shift.expectedLarge}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => openShiftBoard(shift.id)}
                          className="px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Open Board
                        </button>
                        <button
                          onClick={() => openEditShift(shift)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-100 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                No shifts for this day.
              </div>
            )}
          </aside>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Weekly totals</p>
              <p className="text-xs sm:text-sm text-gray-600">Small + Large combined</p>
            </div>
            <span className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold',
              weekTotals.fillRate >= 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            )}>
              {weekTotals.fillRate}% fill
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase">Expected</p>
              <p className="font-semibold text-gray-900">{weekTotals.expectedTotal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Loaded</p>
              <p className="font-semibold text-gray-900">{weekTotals.loadedTotal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Small</p>
              <p className="font-semibold text-gray-900">{weekTotals.loadedSmall}/{weekTotals.expectedSmall}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Large</p>
              <p className="font-semibold text-gray-900">{weekTotals.loadedLarge}/{weekTotals.expectedLarge}</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center">
          <div className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold">Loading shifts...</div>
        </div>
      )}

      <ShiftFormModal
        isOpen={formOpen}
        title={editingShift ? 'Edit Shift' : 'New Shift'}
        initialShift={editingShift ? {
          id: editingShift.id,
          startAt: editingShift.startAt,
          endAt: editingShift.endAt,
          expectedSmall: editingShift.expectedSmall,
          loadedSmall: editingShift.loadedSmall,
          expectedLarge: editingShift.expectedLarge,
          loadedLarge: editingShift.loadedLarge,
        } : null}
        onClose={handleCloseForm}
        onSave={handleSaveShift}
      />
    </div>
  );
};
