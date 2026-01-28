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
  createdAt: Date;
}

export interface FilterState {
  format: LoadFormat | 'All';
  vehicleGroup: string | 'All';
  statuses: LoadStatus[];
}
