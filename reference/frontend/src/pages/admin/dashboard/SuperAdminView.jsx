import React, { useState } from 'react';
import { Users, Shield, Radio, Activity, Server, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // ✅ Import Hook
import { StatCard, SectionHeader } from './DashboardWidgets';
import AuditLogModal from './AuditLogModal'; // ✅ Import new modal

const SuperAdminView = ({ stats }) => {
  const navigate = useNavigate(); // ✅ Initialize
  const [showAuditModal, setShowAuditModal] = useState(false); // ✅ State for modal

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader 
        title="System Overview" 
        subtitle="Platform health and staff distribution." 
      />

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.userCount} icon={Users} color="bg-blue-500" />
        <StatCard title="Admins" value={stats.adminCount} icon={Shield} color="bg-purple-500" />
        <StatCard title="Event Managers" value={stats.eventMgrCount} icon={FileText} color="bg-pink-500" />
        <StatCard title="Total Events" value={stats.totalEvents} icon={Activity} color="bg-orange-500" />
      </div>

      {/* SYSTEM HEALTH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <Server className="text-green-500" size={20} />
            <h3 className="font-bold">System Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-secondary)]">
              <span className="text-sm">Database Connection</span>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">HEALTHY</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-secondary)]">
              <span className="text-sm">Storage (MinIO)</span>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">ONLINE</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <h3 className="font-bold mb-4">Quick Administrative Actions</h3>
          <div className="flex gap-3">
            <button 
                onClick={() => navigate('/admin/users')} // ✅ Navigate to Users page
                className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              Create New Staff
            </button>
            <button 
                onClick={() => setShowAuditModal(true)} // ✅ Open Modal
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-sm font-medium transition-all"
            >
              View Audit Logs
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Render Modal Conditionaly */}
      {showAuditModal && (
        <AuditLogModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
};

export default SuperAdminView;