import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, productsApi } from '../api/api';
import { Button } from '../components/ui/UI';
import { ArrowLeft, Save, Send, RefreshCw, FileDown, FileUp, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Product } from '../types';

const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Fetch single order to get PO Number and metadata
    const { data: order, isLoading: isOrderLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(parseInt(id!)),
        enabled: !!id,
    });

    // Fetch all lines for this Filename
    const { data: poLines } = useQuery({
        queryKey: ['po-lines', order?.filename],
        queryFn: () => orderApi.getAll({ filename: order?.filename }),
        enabled: !!order?.filename,
    });

    const { data: products } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => productsApi.getAll()
    });

    // Sync state when data changes
    useEffect(() => {
        if (poLines) {
            const qtys: Record<string, number> = {};
            poLines.forEach((line: any) => {
                qtys[line.sku] = line.order_qty;
            });
            setQuantities(qtys);
        }
    }, [poLines]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!order) return;
            const promises = [];

            for (const product of products || []) {
                const qty = quantities[product.Material_Code] || 0;
                const existingLine = poLines?.find((l: any) => l.sku === product.Material_Code);

                if (existingLine) {
                    if (qty !== existingLine.order_qty) {
                        promises.push(orderApi.update(existingLine.id, {
                            order_qty: qty,
                            modified_by: 'admin'
                        }));
                    }
                } else if (qty > 0) {
                    promises.push(orderApi.create({
                        dist_id: order.dist_id,
                        filename: order.filename,
                        po_date: order.po_date,
                        dlv_date: order.dlv_date,
                        principle: order.principle,
                        sku: product.Material_Code,
                        product_name: product.Material_Description,
                        crt2plt: product.CRT2PLT,
                        order_qty: qty,
                        uom: product.BASEUOM,
                        created_by: 'admin',
                        periode: order.periode,
                        order_type: order.order_type
                    }));
                }
            }
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['po-lines', order?.filename] });
            alert('Draft saved successfully!');
        },
    });

    const submitMutation = useMutation({
        mutationFn: () => orderApi.submit(order!.filename),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            navigate('/');
        },
    });

    const handleQtyChange = (sku: string, qty: string) => {
        const val = parseInt(qty) || 0;
        setQuantities(prev => ({ ...prev, [sku]: val }));
    };

    const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);

    const handleSubmit = () => {
        if (totalQty === 0) {
            alert('Cannot submit order with total quantity 0. Please update at least one item.');
            return;
        }
        submitMutation.mutate();
    };

    if (isOrderLoading) return <div className="p-10 text-center">Loading order...</div>;

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            {/* Header Toolbar */}
            <div className="p-4 border-b border-neutral-100 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                    </Button>
                    <div className="h-4 w-px bg-neutral-200 mx-2" />
                    <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">Order Details</h2>
                    <span className={clsx(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ml-3",
                        order?.status === 'SUBMITTED' ? "bg-green-100 text-green-800" : "bg-[#A51C24]/10 text-[#A51C24]"
                    )}>
                        {order?.status}
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <RefreshCw size={14} className="mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <FileDown size={14} className="mr-2" />
                        Download
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <FileUp size={14} className="mr-2" />
                        Upload
                    </Button>
                    <div className="h-6 w-px bg-neutral-200 mx-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 bg-white text-neutral-700 hover:bg-neutral-50"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending || order?.status !== 'DRAFT'}
                    >
                        {saveMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                        Save Draft
                    </Button>
                    <Button
                        size="sm"
                        className="h-9"
                        onClick={handleSubmit}
                        disabled={order?.status !== 'DRAFT' || submitMutation.isPending}
                    >
                        {submitMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Send size={14} className="mr-2" />}
                        Submit Order
                    </Button>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-neutral-800 text-white px-6 py-4 grid grid-cols-4 gap-4">
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Order Id</span>
                    <span className="text-sm font-medium">{order?.filename}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Principal</span>
                    <span className="text-sm font-medium">{order?.principle}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Order Type</span>
                    <span className="text-sm font-medium">{order?.order_type || 'Urgent Order'}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Period</span>
                    <span className="text-sm font-medium">{order?.periode || 'February 2026'}</span>
                </div>
            </div>

            {/* Product Selection Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-[#A51C24]">
                            <tr>
                                <th className="px-4 py-2 text-left text-[10px] font-bold text-white uppercase tracking-widest w-12 text-center">No.</th>
                                <th className="px-4 py-2 text-left text-[10px] font-bold text-white uppercase tracking-widest w-32">SKU</th>
                                <th className="px-4 py-2 text-left text-[10px] font-bold text-white uppercase tracking-widest">Material Description</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-white uppercase tracking-widest w-32">Order Qty</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-white uppercase tracking-widest w-24">UOM</th>
                                <th className="px-4 py-2 text-right text-[10px] font-bold text-white uppercase tracking-widest w-32">Price / UOM</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-100">
                            {products?.map((product, index) => (
                                <tr key={product.Material_Code} className="hover:bg-neutral-50/50">
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-neutral-400 font-medium text-center">{index + 1}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-[#A51C24]">{product.Material_Code}</td>
                                    <td className="px-4 py-2 text-xs text-neutral-700 font-medium">{product.Material_Description}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <input
                                            type="number"
                                            className="w-full h-8 text-center text-xs font-bold border-neutral-200 rounded focus:ring-[#A51C24]"
                                            value={quantities[product.Material_Code] || 0}
                                            onChange={(e) => handleQtyChange(product.Material_Code, e.target.value)}
                                            disabled={order?.status !== 'DRAFT'}
                                        />
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-center text-neutral-500 font-bold">{product.BASEUOM}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-right text-neutral-600 font-medium">
                                        {product.price}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-bold">
                            <tr>
                                <td colSpan={3} className="px-4 py-2 text-right text-[10px] uppercase tracking-widest text-neutral-500">Total Order</td>
                                <td className="px-4 py-2 text-center text-sm text-[#A51C24]">
                                    {Object.values(quantities).reduce((a, b) => a + b, 0)}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
