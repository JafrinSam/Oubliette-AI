import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    // Theme classes: bg-surface, text-secondary, border-border
    <footer className="bg-surface text-secondary border-t border-border mt-auto py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm">
        <p>
          &copy; {currentYear} Web FM Commander. All rights reserved.
        </p>
        <div className="space-x-4">
            <span className="text-xs">API: <span className="font-semibold text-green-500">Connected</span></span>
            <span className="text-xs">Liquidsoap: <span className="font-semibold text-green-500">Active</span></span>
        </div>
      </div>
    </footer>
  );
}