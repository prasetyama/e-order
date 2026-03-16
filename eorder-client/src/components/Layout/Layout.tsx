import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../api/api';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Layout = () => {
    const location = useLocation();

    const { data: orders } = useQuery({
        queryKey: ['orders-stats'],
        queryFn: () => orderApi.getAll({ grouped: true } as any),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const stats = {
        drafts: orders?.filter((o: any) => o.status === 'DRAFT').length || 0,
        submitted: orders?.filter((o: any) => o.status === 'SUBMITTED').length || 0,
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Create Order', path: '/create', icon: PlusCircle },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-[#A51C24] text-white shadow-lg sticky top-0 z-50">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-white p-1 rounded-sm">
                            <div className="w-6 h-6 bg-[#A51C24] rounded-sm flex items-center justify-center font-bold text-xs">EO</div>
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight uppercase">E-Order System</h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex flex-col items-end">
                            <span className="text-xs opacity-80">Connected as</span>
                            <span className="text-sm font-medium">Administrator</span>
                        </div>
                        <button className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-8">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group",
                                        isActive
                                            ? "bg-[#A51C24] text-white shadow-md shadow-[#A51C24]/20"
                                            : "text-neutral-600 hover:bg-neutral-100 hover:text-[#A51C24]"
                                    )}
                                >
                                    <Icon className={cn(
                                        "mr-3 size-5 transition-colors",
                                        isActive ? "text-white" : "text-neutral-400 group-hover:text-[#A51C24]"
                                    )} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-neutral-200">
                        <div className="px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Quick Stats</div>
                        <div className="space-y-3 px-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">Drafts</span>
                                <span className="text-xs font-bold bg-[#A51C24]/10 text-[#A51C24] px-1.5 py-0.5 rounded">{stats.drafts}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">Submitted</span>
                                <span className="text-xs font-bold text-neutral-700 px-1.5 py-0.5">{stats.submitted}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                    <Outlet />
                </main>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-neutral-200 py-3 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                    &copy; 2026 E-ORDER MANAGEMENT SYSTEM - PT. NIRWANA LESTARI
                </div>
            </footer>
        </div>
    );
};

export default Layout;
