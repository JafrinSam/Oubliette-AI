import { useState, useEffect } from 'react';
import { Shield, Users, AlertTriangle, Trash2, UserCog, Network } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const roleBadge = {
    ML_ADMIN: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
    DATA_SCIENTIST: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    SECURITY_AUDITOR: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30' },
};

const clearanceColors = {
    UNCLASSIFIED: 'text-gray-400 border-gray-400/30',
    INTERNAL: 'text-blue-400 border-blue-400/30',
    RESTRICTED: 'text-orange-400 border-orange-400/30',
    TOP_SECRET: 'text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
};

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Register modal state
    const [showModal, setShowModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('DATA_SCIENTIST');
    const [newClearance, setNewClearance] = useState('UNCLASSIFIED'); // ✨ NEW
    const [newDepartment, setNewDepartment] = useState('GENERAL');    // ✨ NEW
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleProvision = async (e) => {
        e.preventDefault();
        setModalError('');
        setModalLoading(true);
        try {
            await api.post('/auth/register', { 
                email: newEmail, 
                password: newPassword, 
                role: newRole,
                clearanceLevel: newClearance,
                department: newDepartment
            });
            setShowModal(false);
            // Reset form
            setNewEmail(''); setNewPassword(''); setNewRole('DATA_SCIENTIST');
            setNewClearance('UNCLASSIFIED'); setNewDepartment('GENERAL');
            fetchUsers();
        } catch (err) {
            setModalError(err.response?.data?.error || 'Failed to provision identity.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Revoke this identity permanently?')) return;
        try {
            await api.delete(`/auth/users/${userId}`);
            fetchUsers();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/auth/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err) {
            console.error('Role update failed:', err);
        }
    };

    // ✨ NEW: Handle ABAC inline updates
    const handleAbacChange = async (userId, field, value) => {
        try {
            await api.patch(`/auth/users/${userId}/abac`, { [field]: value });
            fetchUsers();
        } catch (err) {
            console.error('ABAC update failed:', err);
        }
    };

    // Compute stats
    const stats = {
        total: users.length,
        scientists: users.filter(u => u.role === 'DATA_SCIENTIST').length,
        admins: users.filter(u => u.role === 'ML_ADMIN').length,
        auditors: users.filter(u => u.role === 'SECURITY_AUDITOR').length,
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Identity & Access Management</h1>
                    <p className="text-text-muted text-sm mt-1 font-mono">Zero-Trust Micro-segmentation Control</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Shield size={16} />
                    + Provision New Identity
                </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <MetricCard icon={Users} label="Active Identities" value={stats.total} color="text-primary" />
                <MetricCard icon={UserCog} label="ML Admins" value={stats.admins} color="text-primary" />
                <MetricCard icon={Shield} label="Data Scientists" value={stats.scientists} color="text-blue-400" />
                <MetricCard icon={AlertTriangle} label="Security Auditors" value={stats.auditors} color="text-warning" />
            </div>

            {/* User Table */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-background border-b border-border text-[10px] uppercase tracking-wider text-text-muted font-mono">
                            <th className="px-6 py-4">Identity / UUID</th>
                            <th className="px-6 py-4">Zero-Trust Role (RBAC)</th>
                            <th className="px-6 py-4">Clearance & Dept (ABAC)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Access Controls</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">Loading identities...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">No registered identities.</td></tr>
                        ) : users.map(u => {
                            const badge = roleBadge[u.role] || roleBadge.DATA_SCIENTIST;
                            const clearanceStyle = clearanceColors[u.clearanceLevel] || clearanceColors.UNCLASSIFIED;
                            
                            return (
                                <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-text-main font-medium">{u.email}</div>
                                        <div className="text-text-muted font-mono text-xs mt-0.5">
                                            usr_{u.id.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-background/50 uppercase tracking-wide ${clearanceStyle}`}>
                                                <Shield size={10} className="mr-1" /> {u.clearanceLevel}
                                            </span>
                                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-background text-text-muted">
                                                <Network size={10} className="mr-1" /> {u.department}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center text-success text-xs font-medium">
                                            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col gap-2 items-end justify-center">
                                            {/* RBAC Control */}
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === currentUser?.id}
                                                className="bg-background border border-border rounded-lg text-xs px-2 py-1 text-text-main outline-none disabled:opacity-40 w-36"
                                            >
                                                <option value="DATA_SCIENTIST">DATA_SCIENTIST</option>
                                                <option value="ML_ADMIN">ML_ADMIN</option>
                                                <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                                            </select>
                                            
                                            {/* ABAC Controls */}
                                            <div className="flex gap-1">
                                                <select
                                                    value={u.clearanceLevel}
                                                    onChange={(e) => handleAbacChange(u.id, 'clearanceLevel', e.target.value)}
                                                    disabled={u.id === currentUser?.id}
                                                    className="bg-background border border-border rounded-lg text-[10px] px-1.5 py-1 text-text-muted outline-none disabled:opacity-40 w-24"
                                                    title="Change Clearance Level"
                                                >
                                                    <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                                                    <option value="INTERNAL">INTERNAL</option>
                                                    <option value="RESTRICTED">RESTRICTED</option>
                                                    <option value="TOP_SECRET">TOP_SECRET</option>
                                                </select>
                                                <select
                                                    value={u.department}
                                                    onChange={(e) => handleAbacChange(u.id, 'department', e.target.value)}
                                                    disabled={u.id === currentUser?.id}
                                                    className="bg-background border border-border rounded-lg text-[10px] px-1.5 py-1 text-text-muted outline-none disabled:opacity-40 w-24"
                                                    title="Change Department"
                                                >
                                                    <option value="GENERAL">GENERAL</option>
                                                    <option value="FINANCE">FINANCE</option>
                                                    <option value="HEALTHCARE">HEALTHCARE</option>
                                                    <option value="NLP_RESEARCH">NLP_RESEARCH</option>
                                                </select>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={u.id === currentUser?.id}
                                                    className="text-error/60 hover:text-error transition-colors disabled:opacity-20 ml-1 p-1"
                                                    title="Revoke Identity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Provision Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 relative my-8" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400 rounded-t-2xl"></div>
                        <h3 className="text-lg font-bold text-text-main mb-1">Provision New Identity</h3>
                        <p className="text-text-muted text-sm mb-6">Create a new user with Zero-Trust RBAC and ABAC assignments.</p>

                        {modalError && (
                            <div className="flex items-center gap-2 bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 mb-4 text-sm">
                                <AlertTriangle size={16} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleProvision} className="space-y-4">
                            {/* Identity Credentials */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-text-main text-xs font-medium mb-1 uppercase tracking-wider">Email</label>
                                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted"
                                        placeholder="user@enterprise.local" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-text-main text-xs font-medium mb-1 uppercase tracking-wider">Passphrase</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted"
                                        placeholder="••••••••••" />
                                </div>
                            </div>

                            <hr className="border-border my-2" />

                            {/* Access Control Config */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-text-main text-xs font-medium mb-1 uppercase tracking-wider text-primary">Cryptographic Role (RBAC)</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                        className="w-full bg-background border border-primary/30 rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40">
                                        <option value="DATA_SCIENTIST">DATA_SCIENTIST</option>
                                        <option value="ML_ADMIN">ML_ADMIN</option>
                                        <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-text-main text-xs font-medium mb-1 uppercase tracking-wider text-orange-400">Clearance Level</label>
                                        <select value={newClearance} onChange={e => setNewClearance(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-main text-sm outline-none focus:ring-2 focus:ring-orange-400/40">
                                            <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                                            <option value="INTERNAL">INTERNAL</option>
                                            <option value="RESTRICTED">RESTRICTED</option>
                                            <option value="TOP_SECRET">TOP_SECRET</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-text-main text-xs font-medium mb-1 uppercase tracking-wider text-blue-400">Department</label>
                                        <select value={newDepartment} onChange={e => setNewDepartment(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-main text-sm outline-none focus:ring-2 focus:ring-blue-400/40">
                                            <option value="GENERAL">GENERAL</option>
                                            <option value="FINANCE">FINANCE</option>
                                            <option value="HEALTHCARE">HEALTHCARE</option>
                                            <option value="NLP_RESEARCH">NLP_RESEARCH</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-border text-text-muted hover:text-text-main py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={modalLoading}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-60">
                                    {modalLoading ? 'Creating...' : 'Provision'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable metric card component
function MetricCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                    <Icon size={18} className={color} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-text-main font-mono">{value}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{label}</p>
                </div>
            </div>
        </div>
    );
}
