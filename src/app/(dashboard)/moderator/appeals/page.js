'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, MessageSquare, Clock } from 'lucide-react';
import StatusBadge from '../../_components/StatusBadge';

export default function AppealsPage() {
    const router = useRouter();
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchAppeals();
    }, [filter]);

    const fetchAppeals = async () => {
        try {
            const res = await fetch(`/api/dashboard/moderator/appeals?status=${filter}`);
            const data = await res.json();
            setAppeals(data);
        } catch (error) {
            console.error('Error fetching appeals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (appealId, action) => {
        if (!confirm(`Are you sure you want to ${action} this appeal?`)) return;

        try {
            const res = await fetch(`/api/dashboard/moderator/appeals/${appealId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                fetchAppeals();
            } else {
                const error = await res.json();
                alert(error.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Action failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
            case 'ACCEPTED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Appeal Requests</h1>
                    <p className="text-gray-600 mt-1">Review user appeals for moderation decisions</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="all">All Appeals</option>
                </select>
            </div>

            {/* Appeals List */}
            <div className="space-y-4">
                {appeals.map((appeal) => (
                    <div key={appeal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${appeal.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                                appeal.status === 'UNDER_REVIEW' ? 'bg-blue-50 text-blue-600' :
                                    appeal.status === 'ACCEPTED' ? 'bg-green-50 text-green-600' :
                                        'bg-red-50 text-red-600'
                                }`}>
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-gray-900">
                                            Appeal #{appeal.id.slice(0, 8)}
                                        </h3>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(appeal.status)}`}>
                                            {appeal.status}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(appeal.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{appeal.message}</p>
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Original Report:</p>
                                    <p className="text-sm text-gray-700">{appeal.report_reason}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Content: {appeal.content_type} - {appeal.content_title}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {appeal.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(appeal.id, 'review')}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                            >
                                                Start Review
                                            </button>
                                            <button
                                                onClick={() => handleAction(appeal.id, 'reject')}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {appeal.status === 'UNDER_REVIEW' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(appeal.id, 'accept')}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                            >
                                                Accept Appeal
                                            </button>
                                            <button
                                                onClick={() => handleAction(appeal.id, 'reject')}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => router.push(`/moderator/appeals/${appeal.id}/review`)}
                                        className="p-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {appeals.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No appeals found</p>
                    </div>
                )}
            </div>
        </div>
    );
}