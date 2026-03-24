import { useState, useEffect } from 'react';
import { Shield, Users, AlertTriangle, Server, Trash2, UserCog } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const roleBadge = {
    ML_ADMIN: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
    DATA_SCIENTIST: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    SECURITY_AUDITOR: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30' },
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
            await api.post('/auth/register', { email: newEmail, password: newPassword, role: newRole });
            setShowModal(false);
            setNewEmail(''); setNewPassword(''); setNewRole('DATA_SCIENTIST');
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
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-background border-b border-border text-[10px] uppercase tracking-wider text-text-muted font-mono">
                            <th className="px-6 py-4">Identity / UUID</th>
                            <th className="px-6 py-4">Zero-Trust Role</th>
                            <th className="px-6 py-4">Owned Resources</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Clearance Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">Loading identities...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">No registered identities.</td></tr>
                        ) : users.map(u => {
                            const badge = roleBadge[u.role] || roleBadge.DATA_SCIENTIST;
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
                                    <td className="px-6 py-4 text-text-muted font-mono text-xs">
                                        {u._count ? (
                                            <>
                                                <span className="text-text-main font-semibold">{u._count.datasets}</span> Datasets | {' '}
                                                <span className="text-text-main font-semibold">{u._count.scripts}</span> Scripts | {' '}
                                                <span className="text-text-main font-semibold">{u._count.jobs}</span> Jobs
                                            </>
                                        ) : (
                                            u.role === 'SECURITY_AUDITOR' ? (
                                                <span className="italic text-text-muted">Read-Only Access</span>
                                            ) : '—'
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center text-success text-xs font-medium">
                                            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === currentUser?.id}
                                                className="bg-background border border-border rounded-lg text-xs px-2 py-1.5 text-text-main outline-none disabled:opacity-40"
                                            >
                                                <option value="DATA_SCIENTIST">DATA_SCIENTIST</option>
                                                <option value="ML_ADMIN">ML_ADMIN</option>
                                                <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                                            </select>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                disabled={u.id === currentUser?.id}
                                                className="text-error/60 hover:text-error transition-colors disabled:opacity-20"
                                                title="Revoke Access"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400 rounded-t-2xl"></div>
                        <h3 className="text-lg font-bold text-text-main mb-1">Provision New Identity</h3>
                        <p className="text-text-muted text-sm mb-6">Create a new user with a Zero-Trust role assignment.</p>

                        {modalError && (
                            <div className="flex items-center gap-2 bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 mb-4 text-sm">
                                <AlertTriangle size={16} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleProvision} className="space-y-4">
                            <div>
                                <label className="block text-text-main text-sm font-medium mb-1">Email</label>
                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted"
                                    placeholder="user@enterprise.local" />
                            </div>
                            <div>
                                <label className="block text-text-main text-sm font-medium mb-1">Passphrase</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted"
                                    placeholder="••••••••••" />
                            </div>
                            <div>
                                <label className="block text-text-main text-sm font-medium mb-1">Cryptographic Role (RBAC)</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main text-sm outline-none focus:ring-2 focus:ring-primary/40">
                                    <option value="DATA_SCIENTIST">DATA_SCIENTIST</option>
                                    <option value="ML_ADMIN">ML_ADMIN</option>
                                    <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
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
