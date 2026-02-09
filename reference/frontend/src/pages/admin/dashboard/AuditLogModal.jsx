import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, Search, Filter, RefreshCcw } from 'lucide-react';
import useFetch from '../../../hooks/useFetch'; 
import ModalPortal from '../../../components/utils/ModalPortal';
import { useTheme } from '../../../context/ThemeContext'; // ✅ Import Theme Hook

export default function AuditLogModal({ onClose }) {
  const { data, loading, error, get } = useFetch();
  const { themeName } = useTheme(); // ✅ Get current theme ('light' or 'dark')
  
  // --- State for Filters ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    entityType: '',
    action: ''
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // --- Fetch Logs ---
  const fetchLogs = () => {
    const params = new URLSearchParams({ limit: 50 });
    
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.action) params.append('action', filters.action);
    if (debouncedSearch) params.append('search', debouncedSearch);

    get(`/audit?${params.toString()}`);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, filters, debouncedSearch]);

  // Client-side fallback filtering
  let logs = data?.data || [];
  if (debouncedSearch) {
    const lowerSearch = debouncedSearch.toLowerCase();
    logs = logs.filter(log => 
        log.entityName?.toLowerCase().includes(lowerSearch) || 
        log.user?.name?.toLowerCase().includes(lowerSearch) ||
        log.entityType?.toLowerCase().includes(lowerSearch)
    );
  }

  // --- Dynamic Styles based on Theme ---
  // We use CSS variables for backgrounds/borders to match your main layout
  // But for specific modal overrides, we check `themeName`
  const isDark = themeName === 'dark';

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      {/* using var(--bg-card) ensures it matches your theme automatically */}
      <div className="fixed inset-4 md:inset-auto md:w-full md:max-w-5xl md:h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-50">
        
        {/* 1. Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <ShieldIcon /> System Audit Logs
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">Monitor and track system-wide changes.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={24} />
          </button>
        </div>

        {/* 2. Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)]" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by User, Entity, or ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                />
            </div>

            {/* Filters Row */}
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto">
                {/* Entity Filter */}
                <div className="relative">
                    <select 
                        className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium focus:outline-none cursor-pointer hover:bg-[var(--bg-secondary)]/80"
                        value={filters.entityType}
                        onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                    >
                        <option value="">All Entities</option>
                        <option value="User">Users</option>
                        <option value="CollegeEvent">Events</option>
                        <option value="Show">Shows</option>
                        <option value="RJ">RJs</option>
                        <option value="WeeklySchedule">Schedules</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-[var(--text-secondary)]" size={16} />
                </div>

                {/* Action Filter */}
                <select 
                    className="pl-4 pr-8 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-medium focus:outline-none cursor-pointer hover:bg-[var(--bg-secondary)]/80"
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                </select>

                {/* Refresh Button */}
                <button 
                    onClick={fetchLogs} 
                    className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        {/* 3. Data Table */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-secondary)]">
              <Loader2 className="animate-spin text-[var(--accent-color)]" size={32} />
              <p className="text-sm">Fetching audit records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500">
              <AlertCircle size={32} />
              <p className="text-sm">Failed to load logs. Server might be busy.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-secondary)] opacity-60">
              <Search size={48} className="mb-2" />
              <p>No audit logs match your criteria.</p>
              <button onClick={() => { setSearch(''); setFilters({ entityType: '', action: '' }); }} className="text-[var(--accent-color)] text-sm hover:underline">
                Clear Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-secondary)] sticky top-0 z-10 shadow-sm border-b border-[var(--border-color)]">
                <tr>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Entity</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actor</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Changes</th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {logs.map((log) => (
                  <tr key={log._id} className="group hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    
                    <td className="p-4 whitespace-nowrap">
                      <ActionBadge action={log.action} isDark={isDark} />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[var(--text-primary)]">{log.entityName || 'Unknown'}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded w-fit mt-1 border border-[var(--border-color)]">
                            {log.entityType}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar src={log.user?.avatar} name={log.user?.name} />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-[var(--text-primary)]">{log.user?.name || 'System'}</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">{log.user?.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] p-2 rounded max-w-[250px] truncate">
                        {log.changes ? formatChanges(log.changes) : <span className="opacity-50">No details recorded</span>}
                      </div>
                    </td>

                    <td className="p-4 text-xs text-right text-[var(--text-secondary)] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="opacity-60">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

// --- Sub-Components ---

const ActionBadge = ({ action, isDark }) => {
    // We can define dynamic classes based on action type
    // Since we are inside a Tailwind context, we use standard tailwind colors 
    // but can adjust opacity/shade for dark mode if needed.
    
    let colorClass = '';
    
    switch (action) {
        case 'CREATE': 
            colorClass = isDark 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-green-100 text-green-700 border-green-200';
            break;
        case 'UPDATE':
            colorClass = isDark 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                : 'bg-blue-100 text-blue-700 border-blue-200';
            break;
        case 'DELETE':
            colorClass = isDark 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-red-100 text-red-700 border-red-200';
            break;
        case 'LOGIN':
            colorClass = isDark 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                : 'bg-purple-100 text-purple-700 border-purple-200';
            break;
        default:
            colorClass = 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)]';
    }

    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${colorClass}`}>
            {action}
        </span>
    );
};

const Avatar = ({ src, name }) => (
    src ? (
        <img src={src} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />
    ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-color)] to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border border-[var(--border-color)]">
            {name?.[0]?.toUpperCase() || '?'}
        </div>
    )
);

const formatChanges = (changes) => {
    if (changes.snapshot) return "Object Deleted (Snapshot Saved)";
    const keys = Object.keys(changes);
    if (keys.length === 0) return "No specific fields";
    return keys.map(k => k).join(', ') + (keys.length > 1 ? ' updated' : ' updated');
};

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-color)]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);