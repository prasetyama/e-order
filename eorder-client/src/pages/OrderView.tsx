import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/api';
import { Button } from '../components/ui/UI';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { OrderDetail } from '../types';

const OrderView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>('');

    // Fetch single order to get PO Number and metadata
    const { data: order, isLoading: isOrderLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(parseInt(id!)),
        enabled: !!id,
    });

    // Fetch all lines for this Filename (Drafts)
    const { data: poLines, isLoading: isLinesLoading } = useQuery<OrderDetail[]>({
        queryKey: ['po-lines', order?.filename],
        queryFn: () => orderApi.getAll({ filename: order?.filename }),
        enabled: !!order?.filename && order.status !== 'SUBMITTED',
    });

    // Fetch invoices if submitted
    const { data: invoices, isLoading: isInvoicesLoading } = useQuery<any[]>({
        queryKey: ['invoices', order?.filename],
        queryFn: () => orderApi.getInvoices(order?.filename!),
        enabled: !!order?.filename && order.status === 'SUBMITTED',
    });

    const order_type_map: Record<number, string> = {
        1: 'Fix',
        2: 'Additional',
        3: 'Urgent Order',
    };

    const principal_map: Record<string, string> = {
        'A00703': 'PT. PERUSAHAAN INDUSTRI CERES',
        'A00NL1': 'PT. NIRWANA LESTARI',
    };

    // Use invoices if submitted, otherwise use poLines
    const displayLines = order?.status === 'SUBMITTED' ? invoices || [] : poLines || [];

    // Filter lines with qty > 0
    const activeLinesRaw = displayLines.filter(line => (line.order_qty || 0) > 0);

    // Group by PO Number
    const groupedByPO = activeLinesRaw.reduce((acc: Record<string, any[]>, line) => {
        const poKey = line.po_number || 'DRAFT';
        if (!acc[poKey]) {
            acc[poKey] = [];
        }
        acc[poKey].push(line);
        return acc;
    }, {});

    const totalQty = activeLinesRaw.reduce((sum, line) => sum + (line.order_qty || 0), 0);
    const poNumbers = Object.keys(groupedByPO);

    // Sync active tab
    useEffect(() => {
        if (poNumbers.length > 0 && (!activeTab || !poNumbers.includes(activeTab))) {
            setActiveTab(poNumbers[0]);
        }
    }, [poNumbers]);

    if (isOrderLoading || isLinesLoading || isInvoicesLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A51C24]"></div>
            </div>
        );
    }

    if (!order) {
        return <div className="p-10 text-center text-neutral-500 font-medium">Order not found.</div>;
    }

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
                    <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">View Order</h2>
                    <span className={clsx(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ml-3",
                        order.status === 'SUBMITTED' ? "bg-green-100 text-green-800" : "bg-[#A51C24]/10 text-[#A51C24]"
                    )}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-neutral-800 text-white px-6 py-4 grid grid-cols-5 gap-4">
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Order Id</span>
                    <span className="text-sm font-medium">{order.filename}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Principal</span>
                    <span className="text-sm font-medium">{principal_map[order.principle] || order.principle}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Order Type</span>
                    <span className="text-sm font-medium">{order_type_map[parseInt(order.order_type as string)] || order.order_type}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Period</span>
                    <span className="text-sm font-medium">{order.periode}</span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Order by</span>
                    <span className="text-sm font-medium">{order.DistName}</span>
                </div>
            </div>

            {/* Tabs Navigation */}
            {poNumbers.length > 0 && (
                <div className="bg-white border-b border-neutral-200 flex items-center overflow-x-auto scrollbar-hide">
                    {poNumbers.map((poNum) => (
                        <button
                            key={poNum}
                            onClick={() => setActiveTab(poNum)}
                            className={clsx(
                                "px-6 py-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-200 border-b-2 whitespace-nowrap",
                                activeTab === poNum
                                    ? "border-[#A51C24] text-[#A51C24] bg-[#A51C24]/5"
                                    : "border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                            )}
                        >
                            {poNum}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {activeTab && groupedByPO[activeTab] ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* PO Summary Card */}
                        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center space-x-10">
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest mb-1.5">Selected PO Number</span>
                                    <span className="text-sm font-bold text-[#A51C24] bg-[#A51C24]/5 px-2 py-1 rounded border border-[#A51C24]/10">
                                        {activeTab}
                                    </span>
                                </div>
                                {activeTab !== 'DRAFT' && groupedByPO[activeTab][0].dlv_date && (
                                    <div>
                                        <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest mb-1.5">Delivery Date</span>
                                        <span className="text-sm font-bold text-neutral-800">
                                            {groupedByPO[activeTab][0].dlv_date}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest mb-1.5">Total Items</span>
                                    <span className="text-sm font-bold text-neutral-800">{groupedByPO[activeTab].length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-[#A51C24]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest w-12 text-center">No.</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest w-32">SKU</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Product Name</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-widest w-32">Order Qty</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-widest w-24">UOM</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-100">
                                    {groupedByPO[activeTab].map((line, index) => (
                                        <tr key={`${activeTab}-${line.sku}-${index}`} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-400 font-medium text-center">{index + 1}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-[#A51C24]">
                                                {line.sku}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 font-medium">
                                                {line.product_name || (line as any).Material_Description || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-neutral-800">
                                                {new Intl.NumberFormat('id-ID').format(line.order_qty)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-center text-neutral-500 font-bold">{line.uom}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-neutral-50 font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-right text-[10px] uppercase tracking-widest text-neutral-500">PO Subtotal</td>
                                        <td className="px-4 py-4 text-center text-sm text-[#A51C24]">
                                            {new Intl.NumberFormat('id-ID').format(groupedByPO[activeTab].reduce((sum, l) => sum + (l.order_qty || 0), 0))}
                                        </td>
                                        <td colSpan={1}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center text-neutral-400 italic text-sm shadow-sm">
                        No items found.
                    </div>
                )}

                {/* Grand Total Bar */}
                {poNumbers.length > 0 && (
                    <div className="bg-neutral-800 text-white p-6 rounded-lg shadow-md flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 p-2 rounded">
                                <span className="text-[10px] uppercase font-black tracking-widest">Total Order</span>
                            </div>
                            <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Aggregate across all POs</span>
                        </div>
                        <span className="text-3xl font-black text-white decoration-[#A51C24] decoration-4 underline-offset-8">
                            {new Intl.NumberFormat('id-ID').format(totalQty)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderView;
