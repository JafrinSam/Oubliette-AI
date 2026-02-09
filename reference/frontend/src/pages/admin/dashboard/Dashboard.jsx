import React, { useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import useFetch from '../../../hooks/useFetch'; // Adjust path if needed

// Import Sub-Components
import SuperAdminView from './SuperAdminView';
import AdminView from './AdminView';
import EventManagerView from './EventManagerView';

export default function Dashboard() {
  // 1. Initialize Hook
  const { data: dashboardData, loading, error, get } = useFetch();

  // 2. Fetch Data on Mount
  useEffect(() => {
    // We pass { showToast: false } (default for GET) to avoid popping up errors
    // if the page fails to load; we show a UI message instead.
    get('/dashboard/stats');
  }, [get]);

  // 3. Loading State (Handles initial mount + fetch time)
  if (loading || (!dashboardData && !error)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="animate-spin text-[var(--accent-color)]" size={40} />
      </div>
    );
  }

  // 4. Error State
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)] gap-4">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500">
            <AlertTriangle size={32} />
        </div>
        <p className="text-lg font-medium">Failed to load dashboard data</p>
        <button 
            onClick={() => get('/dashboard/stats')} 
            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
            Retry
        </button>
      </div>
    );
  }

  // 5. Extract Data
  // The API returns: { success: true, role: '...', stats: {...} }
  const { role, stats } = dashboardData || {};

  // Common Layout Wrapper
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 md:p-10 text-[var(--text-primary)] animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Greeting */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-[var(--text-secondary)] mt-1 capitalize">
                Welcome back, {role?.replace('_', ' ')}
            </p>
        </div>

        {/* Dynamic View Rendering */}
        {role === 'super_admin' && <SuperAdminView stats={stats} />}
        {role === 'admin' && <AdminView stats={stats} />}
        {role === 'event_manager' && <EventManagerView stats={stats} />}
        
        {/* Fallback for unknown roles */}
        {!['super_admin', 'admin', 'event_manager'].includes(role) && (
            <div className="p-6 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>User role <strong>{role || 'Unknown'}</strong> does not have a configured dashboard view.</span>
            </div>
        )}

      </div>
    </div>
  );
}