import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';

const MonitorIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
);

const SmartphoneIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);

export default function SecuritySettings() {
  const {user} = useAuth();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await apiClient.get(`/audit?userId=${user._id}&limit=5&action=LOGIN`);
        setSessions(res.data.data);
      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [user._id]);

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match");
    if (passwords.new.length < 8) return toast.error("Password must be at least 8 chars");

    setLoading(true);
    try {
        await apiClient.post('/auth/change-password', {
            currentPassword: passwords.current,
            newPassword: passwords.new
        });
        toast.success("Password updated successfully!");
        setPasswords({ current: '', new: '', confirm: '' });
    } catch(e) {
        toast.error(e.response?.data?.message || "Failed to update password");
    } finally {
        setLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if(!window.confirm("Are you sure? You will be logged out of all devices.")) return;
    try {
        await apiClient.post('/auth/revoke-sessions');
        toast.success("All other sessions revoked");
        window.location.reload(); 
    } catch(e) {
        toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold mb-1">Security</h3>
        <p className="text-sm text-[var(--text-secondary)]">Manage your password and view active sessions.</p>
      </div>

      <form onSubmit={handleChangePass} className="space-y-4 max-w-lg p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)]">Change Password</h4>
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
        </div>
        
        <input 
          type={showPass ? "text" : "password"} 
          placeholder="Current Password"
          value={passwords.current}
          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
          className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
          required
        />
        <div className="grid grid-cols-2 gap-4">
            <input 
                type={showPass ? "text" : "password"} 
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
                required
            />
            <input 
                type={showPass ? "text" : "password"} 
                placeholder="Confirm New"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
                required
            />
        </div>
        <div className="flex justify-end pt-2">
            <button 
                type="submit" 
                disabled={loading || !passwords.current || !passwords.new}
                className="px-5 py-2 bg-[var(--accent-color)] text-white rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
                {loading ? "Updating..." : "Update Password"}
            </button>
        </div>
      </form>

      <div className="h-px bg-[var(--border-color)] w-full"></div>

      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-4">Recent Login Activity</h4>
        
        <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-card)]">
          {loadingSessions ? (
            <div className="p-6 flex justify-center text-[var(--text-secondary)]">
                <Loader2 className="animate-spin mr-2" /> Loading history...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-secondary)] text-sm">
                No recent login history found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
                {sessions.map((session) => (
                    <div key={session._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)]/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                {session.changes?.os?.toLowerCase().includes('android') || session.changes?.os?.toLowerCase().includes('ios') ? (
                                    <SmartphoneIcon size={20} />
                                ) : (
                                    <MonitorIcon size={20} />
                                )}
                            </div>
                            
                            <div>
                                <p className="font-medium text-sm text-[var(--text-primary)]">
                                    {session.changes?.browser || 'Unknown Browser'} on {session.changes?.os || 'Unknown OS'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)]">
                                    <span>{new Date(session.createdAt).toLocaleString()}</span>
                                    <span>•</span>
                                    <span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[10px]">
                                        {session.ipAddress || 'IP Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:block">
                             {new Date() - new Date(session.createdAt) < 3600000 ? (
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wide rounded-md border border-green-500/20">
                                    Just Now
                                </span>
                             ) : (
                                <span className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wide rounded-md border border-[var(--border-color)]">
                                    Past Login
                                </span>
                             )}
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-[var(--border-color)] w-full"></div>

      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-4">Danger Zone</h4>
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-red-500/10 transition-colors">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h5 className="font-bold text-red-700 dark:text-red-400">Revoke All Sessions</h5>
                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1 max-w-md">
                    If you suspect unauthorized access, use this to immediately log out all devices.
                </p>
            </div>
            <button 
                onClick={handleRevokeSessions}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all whitespace-nowrap"
            >
                <LogOut size={16} /> Sign Out All Devices
            </button>
        </div>
      </div>
    </div>
  );
}