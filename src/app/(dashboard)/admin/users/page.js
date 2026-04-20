'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Filter, Edit, Ban, CheckCircle, Eye, Trash2 } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [search, filter, page]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/users?search=${search}&status=${filter}&page=${page}`);
            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, action) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const res = await fetch(`/api/dashboard/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Action failed');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
            SUSPENDED: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
            BANNED: { label: 'Banned', color: 'bg-red-100 text-red-800' },
        };
        const { label, color } = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Manage public users</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="all">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="BANNED">Banned</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">User</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Joined</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar_url || '/default-avatar.png'} alt={user.name} className="w-8 h-8 rounded-full" />
                                            <span className="font-medium text-gray-900">{user.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-gray-600">{user.email}</td>
                                    <td className="py-3 px-6">{getStatusBadge(user.status)}</td>
                                    <td className="py-3 px-6 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="text-center py-3 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            {user.status === 'ACTIVE' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(user.id, 'suspend')} className="p-1 text-yellow-600 hover:text-yellow-800" title="Suspend">
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleStatusChange(user.id, 'ban')} className="p-1 text-red-600 hover:text-red-800" title="Ban">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                                                <button onClick={() => handleStatusChange(user.id, 'activate')} className="p-1 text-green-600 hover:text-green-800" title="Activate">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-1 text-blue-600 hover:text-blue-800" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                    <span className="px-3 py-1">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
}