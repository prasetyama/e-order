import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/api';
import { Button } from '../components/ui/UI';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { OrderDetail } from '../types';

const OrderView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Fetch single order to get PO Number and metadata
    const { data: order, isLoading: isOrderLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(parseInt(id!)),
        enabled: !!id,
    });

    // Fetch all lines for this Filename
    const { data: poLines, isLoading: isLinesLoading } = useQuery<OrderDetail[]>({
        queryKey: ['po-lines', order?.filename],
        queryFn: () => orderApi.getAll({ filename: order?.filename }),
        enabled: !!order?.filename,
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

    // Filter lines with qty > 0
    const activeLines = poLines?.filter(line => line.order_qty > 0) || [];
    const totalQty = activeLines.reduce((sum, line) => sum + (line.order_qty || 0), 0);

    if (isOrderLoading || isLinesLoading) {
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

                {/* <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <Printer size={14} className="mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <Download size={14} className="mr-2" />
                        Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <Share2 size={14} className="mr-2" />
                        Share
                    </Button>
                </div> */}
            </div>

            {/* Info Bar */}
            <div className="bg-neutral-800 text-white px-6 py-4 grid grid-cols-4 gap-4">
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
            </div>

            {/* Product Table */}
            <div className="flex-1 overflow-auto p-6">
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
                            {activeLines.map((line, index) => (
                                <tr key={line.id} className="hover:bg-neutral-50/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-400 font-medium text-center">{index + 1}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-[#A51C24]">{line.sku}</td>
                                    <td className="px-4 py-3 text-xs text-neutral-700 font-medium">
                                        {/* Since OrderDetail doesn't always have product_name in the schema, we might need to handle it */}
                                        {(line as any).product_name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-neutral-800">
                                        {line.order_qty}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-center text-neutral-500 font-bold">{line.uom}</td>
                                </tr>
                            ))}
                            {activeLines.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-neutral-400 italic text-sm">
                                        No items with quantity greater than 0 found in this order.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-bold">
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-right text-[10px] uppercase tracking-widest text-neutral-500">Total Order Quantity</td>
                                <td className="px-4 py-4 text-center text-sm text-[#A51C24]">
                                    {totalQty}
                                </td>
                                <td colSpan={1}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderView;
