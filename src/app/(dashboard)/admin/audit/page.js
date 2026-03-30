'use client';

import { useEffect, useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [search, entityFilter, actionFilter, page]);

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/audit?search=${search}&entity=${entityFilter}&action=${actionFilter}&page=${page}`);
            const data = await res.json();
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportLogs = async () => {
        const res = await fetch(`/api/dashboard/admin/audit/export?search=${search}&entity=${entityFilter}&action=${actionFilter}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-gray-600">Track all system actions</p></div>
                <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Download className="w-4 h-4" /> Export CSV</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div></div>
                    <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">All Entities</option><option value="USER">User</option><option value="BLOG">Blog</option><option value="COMMENT">Comment</option><option value="SETTING">Setting</option></select>
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">All Actions</option><option value="CREATE">Create</option><option value="UPDATE">Update</option><option value="DELETE">Delete</option><option value="LOGIN">Login</option><option value="LOGOUT">Logout</option></select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left py-3 px-6">Timestamp</th>
                                <th className="text-left py-3 px-6">Actor</th>
                                <th className="text-left py-3 px-6">Action</th>
                                <th className="text-left py-3 px-6">Entity</th>
                                <th className="text-left py-3 px-6">Details</th>
                                <th className="text-left py-3 px-6">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-6 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="py-3 px-6">{log.actor_name || 'System'}</td>
                                    <td className="py-3 px-6"><span className={`px-2 py-1 text-xs rounded-full ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' : log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{log.action}</span></td>
                                    <td className="py-3 px-6">{log.entity_type}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600 max-w-md truncate">{log.message || `${log.entity_type} ID: ${log.entity_id}`}</td>
                                    <td className="py-3 px-6 text-xs">{log.ip_address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {totalPages > 1 && <div className="flex justify-center gap-2 mt-6"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">Prev</button><span className="px-3 py-1">{page}/{totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">Next</button></div>}
        </div>
    );
}