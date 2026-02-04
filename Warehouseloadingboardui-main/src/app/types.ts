export type LoadStatus = 'Pending' | 'In Process' | 'Complete' | 'Verified' | 'Unverified';

export type LoadFormat = 'Small' | 'Large';

export type LoadOrder = 'F' | 'MF' | 'M' | 'MP' | 'P';

export interface Load {
  id: string;
  vehicleId: string;
  loadOrder: LoadOrder;
  clientName: string;
  format: LoadFormat;
  routeCode?: string;
  routeGroup?: string;
  expectedQty: number;
  loadedQty: number;
  palletCount?: number; // Only for Large
  missingIds: string[];
  status: LoadStatus;
  isNA: boolean;
  isFND: boolean;
  createdAt: Date;
  groupId?: string; // Optional parent group
  shiftId?: string;
}

export interface LoadGroup {
  id: string;
  vehicleId: string;
  maxPalletCount: number;
  status: LoadStatus;
  createdAt: Date;
  loads?: Load[]; // Optional children for detail view
  shiftId?: string;
}

export interface FilterState {
  format: LoadFormat | 'All';
  vehicleGroup: string | 'All';
  statuses: LoadStatus[];
}

export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: string;
  startAt: Date;
  endAt?: Date | null;
  status: ShiftStatus;
  expectedSmall: number;
  loadedSmall: number;
  expectedLarge: number;
  loadedLarge: number;
  expectedTotal: number;
  loadedTotal: number;
  fillRate: number;
  workday: string;
  durationHours: number;
  isOverdue: boolean;
}
