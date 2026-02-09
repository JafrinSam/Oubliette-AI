import { Sun, Moon, Bell, Search, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ toggleSidebar }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md">

            {/* Mobile Menu Toggle */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-main"
            >
                <Menu size={24} />
            </button>

            {/* Search Bar (Visual Only) */}
            <div className="hidden md:flex items-center gap-3 bg-surface border border-border rounded-full px-4 py-2.5 w-96 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search size={18} className="text-text-muted" />
                <input
                    type="text"
                    placeholder="Search missions, datasets..."
                    className="bg-transparent border-none outline-none text-sm text-text-main w-full placeholder:text-text-muted"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2.5 right-3 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
                </button>

                <div className="h-8 w-px bg-border mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-text-main leading-none">Cmdr. Shepard</p>
                        <p className="text-xs text-text-muted mt-1">N7 Operative</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface border-2 border-border overflow-hidden">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Shepard"
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}