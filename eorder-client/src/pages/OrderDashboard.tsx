import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/api';
import { Button } from '../components/ui/UI';
import { Eye, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const OrderDashboard = () => {
    const [status, setStatus] = useState('All Status');
    const [periode, setPeriode] = useState('');
    const [search, setSearch] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders', { status, periode, search }],
        queryFn: () => orderApi.getAll({
            grouped: true,
            status: status === 'All Status' ? undefined : status.toUpperCase(),
            periode: periode || undefined,
            filename: search || undefined,
        } as any),
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

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800">Saved Orders</h2>
                        <p className="text-sm text-neutral-500">Manage and track your order drafts and submissions.</p>
                    </div>
                    <Link to="/create">
                        <Button>Create New Order</Button>
                    </Link>
                </div>

                <div className="flex gap-4 items-end bg-white p-4 rounded-lg border border-neutral-200">
                    <div className="w-48">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-9 rounded border-neutral-200 text-sm focus:ring-[#A51C24] transition-shadow"
                        >
                            <option>All Status</option>
                            <option>Draft</option>
                            <option>Submitted</option>
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Period</label>
                        <input
                            type="month"
                            value={periode}
                            onChange={(e) => setPeriode(e.target.value)}
                            className="w-full h-9 rounded border-neutral-200 text-sm focus:ring-[#A51C24]"
                        />
                    </div>
                    <div className="flex-1 px-4 relative">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Order Id..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-10 rounded border-neutral-200 text-sm focus:ring-[#A51C24]"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                            setStatus('All Status');
                            setPeriode('');
                            setSearch('');
                        }}
                    >
                        <Filter size={16} className="mr-2" />
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A51C24]"></div>
                    </div>
                ) : (
                    <div className="overflow-hidden border border-neutral-200 rounded-lg">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-[#A51C24]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">No.</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Order ID</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Principal</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Order Type</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest text-center">Jumlah SKU</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest text-center">Jumlah Qty</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Periode Order</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-widest">Created Date</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold text-white uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-100">
                                {(orders || []).map((order: any, index: number) => (
                                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">{index + 1}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-[#A51C24]">{order.filename}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600 font-medium">{principal_map[order.principle] || 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600">{order_type_map[parseInt(order.order_type)] || 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-center text-neutral-600">{order.total_sku || 0}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-center text-[#A51C24]">{order.total_qty || 0}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-600">{order.periode ? new Date(order.periode).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider",
                                                order.status === 'SUBMITTED' ? "bg-green-100 text-green-800" :
                                                    order.status === 'CANCELLED' ? "bg-red-100 text-red-800" :
                                                        "bg-[#A51C24]/10 text-[#A51C24]"
                                            )}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {order.created_date ? new Date(order.created_date).toLocaleTimeString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                            <Link to={`/order/${order.id}`}>
                                                <Button variant="ghost" size="sm" className="hover:bg-[#A51C24]/10 hover:text-[#A51C24]">
                                                    <Eye size={16} className="mr-2" />
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(!orders || orders.length === 0) && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-neutral-400 italic text-sm">
                                            No orders found. Click "Create New Order" to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDashboard;
