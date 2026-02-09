import { LayoutDashboard, Terminal, Database, UploadCloud, X, Activity, FileCode, Cpu, Book } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/jobs', icon: Terminal, label: 'Mission Control' },
    { path: '/datasets', icon: Database, label: 'Data Vault' },
    { path: '/upload', icon: UploadCloud, label: 'Upload Portal' },
    { path: '/script-lab', icon: FileCode, label: 'Script Lab' },
    { path: '/runtimes', icon: Cpu, label: 'Runtimes' },
    { path: '/docs', icon: Book, label: 'Documentation' },
];

export default function Sidebar({ isOpen, setIsOpen }) {
    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            <aside className={clsx(
                "bg-surface border-r border-border flex flex-col h-screen fixed left-0 top-0 z-40 w-64 transition-transform duration-300",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="h-20 flex items-center gap-3 px-8">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        O
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-main leading-none">Oubliette</h1>
                        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                            AI Systems
                        </span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-text-muted hover:bg-surface-hover hover:text-text-main"
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* System Status Footer */}
                <div className="p-4 mx-4 mb-4 bg-surface-hover rounded-2xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-black/20">
                            <Activity size={16} className="text-success" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-0.5">System Status</p>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                                <p className="text-success text-xs font-bold">OPERATIONAL</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}