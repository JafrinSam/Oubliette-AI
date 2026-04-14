import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function AuditDashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/audit'); 
                setLogs(res.data);
            } catch (err) {
                console.error('Failed to fetch logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getStatusIcon = (status) => {
        if (status === 'SUCCESS') return <CheckCircle size={14} className="text-success mr-1" />;
        if (status === 'DENIED') return <ShieldAlert size={14} className="text-warning mr-1" />;
        return <XCircle size={14} className="text-error mr-1" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Security Audit Trail</h1>
                <p className="text-text-muted text-sm mt-1 font-mono">Immutable Log of Platform Activity</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-background border-b border-border text-[10px] uppercase tracking-wider text-text-muted font-mono">
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Actor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Resource</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Context (Details)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-text-muted">Fetching immutable logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-text-muted">No audit logs found.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="hover:bg-surface-hover transition-colors font-mono text-xs">
                                <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    {log.user ? (
                                        <span className="text-primary">{log.user.email}</span>
                                    ) : (
                                        <span className="text-text-muted">SYSTEM / UNKNOWN</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-text-main font-bold">
                                    {log.action}
                                </td>
                                <td className="px-6 py-4 text-text-muted">
                                    {log.resourceType}: <br/>
                                    <span className="text-[10px]">{log.resourceId || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center font-medium">
                                        {getStatusIcon(log.status)}
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate text-text-muted" title={JSON.stringify(log.details)}>
                                    {JSON.stringify(log.details)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
