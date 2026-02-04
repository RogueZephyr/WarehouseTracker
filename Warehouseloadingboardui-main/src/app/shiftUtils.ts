import { format } from 'date-fns';
import { Shift, ShiftStatus } from './types';

export interface ShiftFormData {
  id?: string;
  startAt: Date;
  endAt?: Date | null;
  expectedSmall: number;
  loadedSmall: number;
  expectedLarge: number;
  loadedLarge: number;
  status?: ShiftStatus;
}

export const toFrontendShift = (data: any): Shift => {
  const startAt = data.start_at ? new Date(data.start_at) : new Date();
  const endAt = data.end_at ? new Date(data.end_at) : null;
  const expectedSmall = Number(data.expected_small) || 0;
  const loadedSmall = Number(data.loaded_small) || 0;
  const expectedLarge = Number(data.expected_large) || 0;
  const loadedLarge = Number(data.loaded_large) || 0;

  const expectedTotal = data.expected_total !== undefined
    ? Number(data.expected_total)
    : expectedSmall + expectedLarge;
  const loadedTotal = data.loaded_total !== undefined
    ? Number(data.loaded_total)
    : loadedSmall + loadedLarge;

  return {
    id: data.id,
    startAt,
    endAt,
    status: data.status || (endAt ? 'closed' : 'open'),
    expectedSmall,
    loadedSmall,
    expectedLarge,
    loadedLarge,
    expectedTotal,
    loadedTotal,
    fillRate: Number(data.fill_rate) || 0,
    workday: data.workday || format(startAt, 'yyyy-MM-dd'),
    durationHours: Number(data.duration_hours) || 0,
    isOverdue: !!data.is_overdue,
  };
};

export const toShiftPayload = (shift: ShiftFormData) => {
  const endAt = shift.endAt ?? null;
  const status = shift.status || (endAt ? 'closed' : 'open');

  return {
    start_at: shift.startAt.toISOString(),
    end_at: endAt ? endAt.toISOString() : null,
    status,
    expected_small: Number(shift.expectedSmall) || 0,
    loaded_small: Number(shift.loadedSmall) || 0,
    expected_large: Number(shift.expectedLarge) || 0,
    loaded_large: Number(shift.loadedLarge) || 0,
  };
};
