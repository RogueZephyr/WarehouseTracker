import React from 'react';
import { useForm } from 'react-hook-form';
import { LoadFormat, LoadOrder, Load } from '../types';
import { X } from 'lucide-react';

interface CreateLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Load, 'id' | 'createdAt' | 'loadedQty' | 'missingIds' | 'status'>) => void;
}

interface FormData {
  clientName: string;
  format: LoadFormat | 'Group';
  routeCode: string;
  routeGroup?: string;
  vehicleId: string;
  loadOrder: LoadOrder;
  expectedQty: number;
  palletCount?: number;
  maxPalletCount?: number;
}

export const CreateLoadModal: React.FC<CreateLoadModalProps & { onCreateGroup: (data: any) => void }> = ({
  isOpen,
  onClose,
  onSubmit,
  onCreateGroup
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      format: 'Small',
      loadOrder: 'F',
    }
  });

  const format = watch('format');
  const routeCode = watch('routeCode');

  if (!isOpen) return null;

  const onFormSubmit = (data: FormData) => {
    if (data.format === 'Group') {
      onCreateGroup({
        vehicleId: data.vehicleId,
        maxPalletCount: Number(data.maxPalletCount) || 0
      });
    } else {
      onSubmit({
        ...data,
        format: data.format as LoadFormat,
        expectedQty: Number(data.expectedQty),
        palletCount: data.palletCount ? Number(data.palletCount) : undefined,
      });
    }
    onClose();
  };

  const isWalgreens = routeCode?.startsWith('23');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New {format === 'Group' ? 'Group' : 'Load'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="create-load-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

            {/* Section 1: Type Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Load Type</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format / Type</label>
                <select
                  {...register('format')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                >
                  <option value="Small">Small Format (Standalone)</option>
                  <option value="Large">Large Format (Standalone)</option>
                  <option value="Group">Large Format Group (Multi-Client)</option>
                </select>
              </div>
            </div>

            {/* Section 2: Vehicle & ID */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
                  <input
                    {...register('vehicleId', { required: 'Vehicle ID is required' })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 2606"
                  />
                  {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId.message}</p>}
                </div>
                {format !== 'Group' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Code</label>
                    <input
                      {...register('routeCode', { required: format === 'Small' ? 'Route code required' : false })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 23-W1"
                    />
                    {errors.routeCode && <p className="mt-1 text-sm text-red-600">{errors.routeCode.message}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Details */}
            {format === 'Group' ? (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Group Constraints</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Pallet Count</label>
                  <input
                    type="number"
                    {...register('maxPalletCount', { required: 'Required', min: 1, valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700"
                    placeholder="e.g. 10"
                  />
                  <p className="mt-2 text-xs text-gray-500 italic">You will add client loads after creating the group.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Load Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    {...register('clientName', { required: (format as any) !== 'Group' })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Walgreens"
                  />
                  {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Qty</label>
                    <input
                      type="number"
                      {...register('expectedQty', { required: true, min: 1, valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Load Order</label>
                    <select
                      {...register('loadOrder')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none"
                    >
                      <option value="F">F</option>
                      <option value="MF">MF</option>
                      <option value="M">M</option>
                      <option value="MP">MP</option>
                      <option value="P">P</option>
                    </select>
                  </div>
                </div>

                {format === 'Large' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pallet Count</label>
                    <input
                      type="number"
                      {...register('palletCount', { required: true, min: 1, valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none"
                    />
                  </div>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3 sm:rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-load-form"
            className="flex-[2] px-4 py-3 text-white font-bold bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-sm"
          >
            Create Load
          </button>
        </div>
      </div>
    </div>
  );
};
