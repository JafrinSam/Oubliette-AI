import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/admin/Navbar';
import Sidebar from '../components/admin/Sidebar';
import CommandPalette from '../components/admin/CommandPalette';


export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-primary transition-colors duration-300">

      <CommandPalette />
      
      {/* 1. TOP NAVIGATION (Full Width) */}
      <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 pt-16"> {/* pt-16 pushes content below the fixed Navbar */}
        
        {/* 2. SIDEBAR (Navigation) */}
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        {/* 3. MAIN CONTENT AREA */}
        {/* lg:ml-64 creates space for the sidebar on large screens */}
        <main className="flex-1 lg:ml-64 p-6 overflow-x-hidden relative z-0">
          <Outlet />
        </main>

      </div>
    </div>
  );
}