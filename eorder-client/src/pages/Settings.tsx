import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '../api/api';
import { Button, Card, Input } from '../components/ui/UI';
import { Settings as SettingsIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const Settings = () => {
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [localMaxQty, setLocalMaxQty] = useState<string>('');
    const [localSplitMode, setLocalSplitMode] = useState<string>('');

    const { data: configs, isLoading } = useQuery({
        queryKey: ['configs'],
        queryFn: configApi.getAll,
    });

    useEffect(() => {
        if (configs) {
            const maxQty = configs.find((c: any) => c.config_key === 'order_split_max_qty')?.config_value || '';
            const splitMode = configs.find((c: any) => c.config_key === 'order_split_mode')?.config_value || '';
            setLocalMaxQty(maxQty);
            setLocalSplitMode(splitMode);
        }
    }, [configs]);

    const updateMutation = useMutation({
        mutationFn: async (payload: { key: string; value: string }[]) => {
            for (const item of payload) {
                await configApi.update(item.key, item.value);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configs'] });
            setSuccessMessage('Settings updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        },
    });

    const handleSave = () => {
        const payload = [
            { key: 'order_split_max_qty', value: localMaxQty },
            { key: 'order_split_mode', value: localSplitMode }
        ];
        updateMutation.mutate(payload);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 space-y-4">
                <Loader2 className="animate-spin size-8" />
                <p className="text-sm font-medium">Loading settings...</p>
            </div>
        );
    }

    const maxQtyConfig = configs?.find((c: any) => c.config_key === 'order_split_max_qty');
    const splitModeConfig = configs?.find((c: any) => c.config_key === 'order_split_mode');

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-[#A51C24] p-2 rounded-lg">
                        <SettingsIcon className="text-white size-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800 tracking-tight">System Settings</h2>
                        <p className="text-sm text-neutral-500">Configure order splitting and distribution rules</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Order Splitting" className="h-full">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                                    Distribution Mode
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A51C24] disabled:cursor-not-allowed disabled:opacity-50"
                                    value={localSplitMode}
                                    onChange={(e) => setLocalSplitMode(e.target.value)}
                                >
                                    <option value="ALL">All Available Weeks</option>
                                    <option value="ODD_ONLY">Odd Weeks Only (1 & 3)</option>
                                </select>
                                <p className="mt-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-widest pl-1">
                                    Currently: {splitModeConfig?.config_value === 'ALL'
                                        ? 'Splits across all weeks'
                                        : 'Only fills weeks 1 and 3'}
                                </p>
                            </div>
                            {localSplitMode === 'ALL' && (
                                <div>
                                    <Input
                                        label="Maximum Quantity Per Shipment"
                                        type="number"
                                        value={localMaxQty}
                                        onChange={(e) => setLocalMaxQty(e.target.value)}
                                        placeholder="e.g. 250"
                                    />
                                    <p className="mt-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-widest pl-1">
                                        Current value: {maxQtyConfig?.config_value}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-neutral-100 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    isLoading={updateMutation.isPending}
                                    className="w-full"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-3">
                            <AlertCircle className="text-amber-500 size-5 mt-0.5 flex-shrink-0" />
                            <div className="text-[11px] text-amber-800 leading-relaxed">
                                <strong>Note:</strong> Changes to these settings will affect all future order submissions.
                                Drafts already submitted will not be affected retroactively.
                            </div>
                        </div>
                    </div>
                </Card>

                {/* <Card title="Information" className="h-full bg-neutral-50/50">
                    <div className="space-y-4">
                        <div className="text-sm text-neutral-600 space-y-4">
                            <div>
                                <p className="font-bold text-[#A51C24] text-xs uppercase mb-1">Maximum Quantity</p>
                                <p className="text-xs leading-relaxed">Controls how many units are placed in a single shipment (week) before overflowing to the next available week.</p>
                            </div>
                            <div>
                                <p className="font-bold text-[#A51C24] text-xs uppercase mb-1">Distribution Mode</p>
                                <ul className="space-y-2 mt-2">
                                    <li className="flex items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#A51C24] mt-1.5 mr-2 flex-shrink-0" />
                                        <div className="text-xs leading-relaxed">
                                            <strong>ALL:</strong> The system will utilize every week available in the calendar month, following the odd-even priority rule.
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#A51C24] mt-1.5 mr-2 flex-shrink-0" />
                                        <div className="text-xs leading-relaxed">
                                            <strong>ODD_ONLY:</strong> The system will restrict shipments to weeks 1 and 3 only, splitting the total quantity into 2 shipments across those weeks.
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-neutral-200 pt-4 mt-6">
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Last Config Update</p>
                            <p className="text-xs text-neutral-600 font-medium">
                                {maxQtyConfig?.updated_at ? new Date(maxQtyConfig.updated_at).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                </Card> */}
            </div>
        </div>
    );
};

export default Settings;
