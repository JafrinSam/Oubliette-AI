import React from 'react';
// 💡 Import the Theme Hook (optional if you want conditional logic, but classes usually suffice)
// import { useTheme } from '../../context/ThemeContext';

function Header() {
    return (
        // Theme classes: bg-card (to distinguish from nav), text-primary
        <header className="bg-card shadow-lg py-4 md:py-6 border-b border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                {/* Logo/Title Section */}
                <div className="flex items-center space-x-3">
                    {/* SVG Icon using 'text-accent' */}
                    <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-5c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1s1 .45 1 1v4.5z"/>
                    </svg>
                    <h1 className="text-3xl font-extrabold text-primary tracking-wider">
                        ADMIN STREAM CONSOLE
                    </h1>
                </div>

                {/* Status/User Info Section */}
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-secondary hidden sm:inline">
                        DJ: Administrator (Online)
                    </span>
                    <button 
                        className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200 shadow-md"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;