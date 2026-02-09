import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Edit2, Trash2, 
  CheckCircle, XCircle, Mail, Shield, Filter, ChevronDown, UserX 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/apiClient';
import UserModal from '../../components/admin/UserModal';
import { useAuth } from '../../context/AuthContext'; 
// 👇 ADD THIS IMPORT 👇
import AccessDenied from '../../components/common/AccessDenied'; 

// --- UTILS & COMPONENTS ---

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const UserAvatar = ({ name, url }) => {
  if (url) {
    return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />;
  }
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const colorIndex = name ? name.length % colors.length : 0;
  return (
    <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

const StatusBadge = ({ isActive }) => (
  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit border transition-all ${
    isActive 
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
      : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
    {isActive ? 'Active' : 'Revoked'}
  </span>
);

const RoleBadge = ({ role }) => {
  const config = {
    super_admin: { color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Super Admin' },
    admin:       { color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Admin' },
    event_manager:{ color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Event Manager' },
    user:        { color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'User' }
  };
  const style = config[role] || config.user;
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${style.color} dark:bg-opacity-10 dark:border-opacity-20`}>
      {style.label}
    </span>
  );
};

// 💀 SKELETON LOADER
const UserTableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
        <td className="p-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </td>
        <td className="p-6"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
        <td className="p-6 hidden md:table-cell"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
        <td className="p-6"><div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" /></td>
        <td className="p-6"><div className="h-8 w-8 ml-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
      </tr>
    ))}
  </>
);

export default function UserManagement() {
  const { user } = useAuth();

  // 1. ACCESS CONTROL CHECK
  // If user is NOT super_admin AND NOT admin, block access.
  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <AccessDenied 
        title="Restricted Access"
        message="You do not have permission to view the User Management module."
      />
    );
  }
  
  // 2. PERMISSION FLAGS
  const isSuperAdmin = user?.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [activeRoleFilter, setActiveRoleFilter] = useState(() => sessionStorage.getItem('userRoleFilter') || 'all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const FILTER_OPTIONS = [
    { label: 'All Roles', value: 'all' },
    { label: 'Super Admins', value: 'super_admin' },
    { label: 'Admins', value: 'admin' },
    { label: 'Event Managers', value: 'event_manager' },
    { label: 'Regular Users', value: 'user' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', {
        params: { 
          role: activeRoleFilter === 'all' ? undefined : activeRoleFilter, 
          search: debouncedSearch 
        }
      });
      setUsers(res.data.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('userRoleFilter', activeRoleFilter);
    fetchUsers();
  }, [activeRoleFilter, debouncedSearch]); 

  const handleAddUser = () => { setSelectedUser(null); setIsModalOpen(true); };
  const handleEditUser = (user) => { setSelectedUser(user); setIsModalOpen(true); };
  
  const handleModalSuccess = () => {
    fetchUsers(); 
  };

  const handleDelete = (id) => {
    toast("Delete this user?", {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          try {
            await apiClient.delete(`/users/${id}`);
            toast.success("User deleted");
            fetchUsers();
          } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
          }
        },
      },
      cancel: { label: "Cancel" },
    });
  };

  const toggleStatus = async (user) => {
    if (!isSuperAdmin) return; 

    const originalUsers = [...users];
    setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));

    try {
      await apiClient.patch(`/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      setUsers(originalUsers); 
      toast.error("Status update failed");
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen font-sans text-[var(--text-primary)]"
         style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm mt-2 opacity-60">
            Manage permissions and access for your station.
          </p>
        </div>
        
        <div className="flex gap-4 text-xs font-medium bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm">
          <div className="px-4 py-1">
            <span className="opacity-50 block mb-1">Total</span>
            <span className="text-lg">{users.length}</span>
          </div>
          <div className="w-px bg-[var(--border-color)]"></div>
          <div className="px-4 py-1">
            <span className="opacity-50 block mb-1">Active</span>
            <span className="text-lg text-emerald-500">{users.filter(u => u.isActive).length}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="rounded-2xl border shadow-sm bg-[var(--bg-card)] overflow-hidden" 
           style={{ borderColor: 'var(--border-color)' }}>
        
        {/* TOOLBAR */}
        <div className="p-4 flex flex-col md:flex-row justify-between gap-4 border-b bg-gray-50/50 dark:bg-white/5" 
             style={{ borderColor: 'var(--border-color)' }}>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-focus-within:text-[var(--accent-color)] transition-all" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] transition-all text-sm"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>

          <div className="flex gap-2">
             <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-[var(--bg-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Filter size={16} className="opacity-60" />
                  <span>{FILTER_OPTIONS.find(o => o.value === activeRoleFilter)?.label}</span>
                  <ChevronDown size={14} className="opacity-40" />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 right-0 w-56 rounded-xl border shadow-xl z-20 overflow-hidden bg-[var(--bg-card)]"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {FILTER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setActiveRoleFilter(option.value); setIsFilterOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                              activeRoleFilter === option.value ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' : ''
                            }`}
                          >
                            {option.label}
                            {activeRoleFilter === option.value && <CheckCircle size={14} />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>

             {/* ONLY SUPER ADMIN CAN SEE ADD BUTTON */}
             {isSuperAdmin && (
               <button 
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[var(--accent-color)] to-orange-600 hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/20 transition-all"
               >
                 <Plus size={18} /> Add Member
               </button>
             )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider opacity-60 font-semibold bg-gray-50/30 dark:bg-white/5" 
                  style={{ borderColor: 'var(--border-color)' }}>
                <th className="p-6 pl-8">User Details</th>
                <th className="p-6">Role</th>
                <th className="p-6 hidden md:table-cell">Contact</th>
                <th className="p-6">Status</th>
                {/* ONLY SUPER ADMIN SEES ACTION HEADER */}
                {isSuperAdmin && <th className="p-6 pr-8 text-right">Action</th>}
              </tr>
            </thead>
            
            <tbody className="text-sm">
              <AnimatePresence>
                {loading ? (
                   <UserTableSkeleton /> 
                ) : users.length === 0 ? (
                   <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <td colSpan={isSuperAdmin ? 5 : 4} className="p-16 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-40">
                         <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                           <UserX size={32} />
                         </div>
                         <div>
                           <p className="font-bold text-lg">No users found</p>
                           <p className="text-sm">Try adjusting your search or filter.</p>
                         </div>
                         {search && (
                           <button onClick={() => setSearch('')} className="text-[var(--accent-color)] hover:underline">
                             Clear Search
                           </button>
                         )}
                       </div>
                     </td>
                   </motion.tr>
                ) : (
                 users.map((user, index) => (
                      <motion.tr 
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                          style={{ borderColor: 'var(--border-color)' }}
                      >
                          {/* User Info */}
                          <td className="p-6 pl-8">
                            <div className="flex items-center gap-4">
                                <UserAvatar name={user.name} url={user.avatar} />
                                <div>
                                  <p className="font-bold text-base">{user.name}</p>
                                  <p className="text-xs opacity-50">ID: {user._id.slice(-6)}</p>
                                </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-6"><RoleBadge role={user.role} /></td>

                          {/* Contact */}
                          <td className="p-6 hidden md:table-cell">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                    <Mail size={14} className="opacity-50" /> {user.email}
                                </div>
                                <div className="flex items-center gap-2 text-xs opacity-60">
                                    <Shield size={14} className="opacity-50" /> {user.authProvider}
                                </div>
                            </div>
                          </td>

                          {/* Status - SuperAdmin can toggle, others see read-only */}
                          <td className="p-6">
                            {isSuperAdmin ? (
                              <button 
                                onClick={() => toggleStatus(user)} 
                                className="hover:scale-105 active:scale-95 transition-transform"
                                title="Click to toggle access"
                              >
                                  <StatusBadge isActive={user.isActive} />
                              </button>
                            ) : (
                              <StatusBadge isActive={user.isActive} />
                            )}
                          </td>

                          {/* ONLY SUPER ADMIN SEES ACTIONS COLUMN */}
                          {isSuperAdmin && (
                            <td className="p-6 pr-8 text-right">
                              <div className="flex items-center justify-end gap-2">
                                  <button 
                                      onClick={() => handleEditUser(user)}
                                      className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                      title="Edit User"
                                  >
                                      <Edit2 size={18} />
                                  </button>
                                  <button 
                                      onClick={() => handleDelete(user._id)}
                                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                      title="Delete User"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                            </td>
                          )}
                      </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={selectedUser}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}