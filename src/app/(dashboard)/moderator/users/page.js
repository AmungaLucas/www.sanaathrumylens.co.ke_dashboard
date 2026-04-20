'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Eye, Shield, UserX, UserCheck } from 'lucide-react';
import StatusBadge from '../../_components/StatusBadge';

export default function FlaggedUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/dashboard/moderator/users?status=${filter}`);
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const res = await fetch(`/api/dashboard/moderator/users/${userId}`, {
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

    const getWarningStatus = (warning) => {
        if (warning.status === 'ACTIVE') {
            if (warning.expires_at && new Date(warning.expires_at) < new Date()) {
                return 'EXPIRED';
            }
            return 'ACTIVE';
        }
        return warning.status;
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Flagged Users</h1>
                    <p className="text-gray-600 mt-1">Manage users with warnings or restrictions</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="active">Active Warnings</option>
                    <option value="all">All Users</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={user.avatar_url || '/default-avatar.png'}
                                        alt={user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                            <span className="text-xs text-gray-500">@{user.username || user.email}</span>
                                            {user.status === 'SUSPENDED' && (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                    Suspended
                                                </span>
                                            )}
                                            {user.status === 'BANNED' && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                                    Banned
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span>{user.total_posts || 0} posts</span>
                                            <span>{user.total_comments || 0} comments</span>
                                            <span>{user.total_reports || 0} reports</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.status === 'ACTIVE' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(user.id, 'warn')}
                                                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                                            >
                                                Issue Warning
                                            </button>
                                            <button
                                                onClick={() => handleAction(user.id, 'suspend')}
                                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
                                            >
                                                Suspend
                                            </button>
                                        </>
                                    )}
                                    {user.status !== 'BANNED' && (
                                        <button
                                            onClick={() => handleAction(user.id, 'ban')}
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                        >
                                            Ban
                                        </button>
                                    )}
                                    {user.status !== 'ACTIVE' && (
                                        <button
                                            onClick={() => handleAction(user.id, 'activate')}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        >
                                            Restore
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Warning History */}
                            {user.warnings && user.warnings.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Warning History</h4>
                                    <div className="space-y-2">
                                        {user.warnings.map((warning) => (
                                            <div key={warning.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                    <span>{warning.reason}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(warning.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getWarningStatus(warning) === 'ACTIVE'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {getWarningStatus(warning)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No flagged users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}