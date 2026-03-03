import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { distributorApi, orderApi } from '../api/api';
import { Card, Button, Input } from '../components/ui/UI';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Distributor } from '../types';

const CreateOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        dist_id: '',
        principle: 'PT. PERUSAHAAN INDUSTRI CERES',
        order_type: 'Urgent Order',
        periode: new Date().toISOString().split('T')[0],
        po_number: `PO-${Date.now()}`,
        po_date: new Date().toISOString().split('T')[0],
        dlv_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        sku: 'TEMP-SKU', // The backend needs one SKU during initial create based on schema
        order_qty: 1,
        uom: 'CS',
    });

    const { data: distributors } = useQuery<Distributor[]>({
        queryKey: ['distributors'],
        queryFn: distributorApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: orderApi.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            navigate(`/order/${data.id}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...formData,
            dist_id: parseInt(formData.dist_id),
        });
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <div className="p-6 border-b border-neutral-100 bg-white shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-[#A51C24] transition-colors mb-4"
                >
                    <ArrowLeft size={14} className="mr-1" />
                    Back to Dashboard
                </button>
                <h2 className="text-xl font-bold text-neutral-800">Create Order to Principal</h2>
                <p className="text-sm text-neutral-500">Initialize a new order by selecting a distributor and order preferences.</p>
            </div>

            <div className="p-8 max-w-2xl mx-auto w-full">
                <Card title="ORDER INFORMATION">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Distributor Profile</label>
                                <select
                                    required
                                    className="w-full h-10 rounded border-neutral-300 text-sm focus:ring-[#A51C24] transition-shadow bg-white"
                                    value={formData.dist_id}
                                    onChange={(e) => setFormData({ ...formData, dist_id: e.target.value })}
                                >
                                    <option value="">Select Distributor</option>
                                    {distributors?.map(dist => (
                                        <option key={dist.DistID} value={dist.DistID}>
                                            {dist.DistName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Choose Principal</label>
                                    <select
                                        className="w-full h-10 rounded border-neutral-300 text-sm focus:ring-[#A51C24] transition-shadow bg-white"
                                        value={formData.principle}
                                        onChange={(e) => setFormData({ ...formData, principle: e.target.value })}
                                    >
                                        <option>PT. PERUSAHAAN INDUSTRI CERES</option>
                                        <option>PT. NIRWANA LESTARI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Order Type</label>
                                    <select
                                        className="w-full h-10 rounded border-neutral-300 text-sm focus:ring-[#A51C24] transition-shadow bg-white"
                                        value={formData.order_type}
                                        onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                                    >
                                        <option>Urgent Order</option>
                                        <option>Normal Order</option>
                                        <option>Buffer Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="PO Number"
                                    value={formData.po_number}
                                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                                />
                                <Input
                                    label="Choose Period"
                                    type="date"
                                    value={formData.periode}
                                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-100 flex justify-end gap-3">
                            <Button variant="ghost" type="button" onClick={() => navigate('/')}>Cancel</Button>
                            <Button
                                type="submit"
                                isLoading={createMutation.isPending}
                                disabled={!formData.dist_id}
                            >
                                <CheckCircle2 size={18} className="mr-2" />
                                Create Order
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="mt-8 p-4 bg-[#A51C24]/5 rounded-lg border border-[#A51C24]/10">
                    <h4 className="text-xs font-bold text-[#A51C24] uppercase tracking-wider mb-2">Note</h4>
                    <p className="text-xs text-[#A51C24]/70 leading-relaxed">
                        After creating the order header, you will be redirected to the product selection page where you can add SKUs and quantities to your order.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;
