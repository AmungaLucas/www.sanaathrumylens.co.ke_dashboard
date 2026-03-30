'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, CheckCircle, XCircle, Eye, AlertTriangle, FileText, MessageCircle } from 'lucide-react';
import StatusBadge from '../../_components/StatusBadge';

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            const res = await fetch(`/api/dashboard/moderator/reports?status=${filter}`);
            const data = await res.json();
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (reportId, action) => {
        if (!confirm('Are you sure you want to resolve this report?')) return;

        try {
            const res = await fetch(`/api/dashboard/moderator/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                fetchReports();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to resolve report');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to resolve report');
        }
    };

    const getContentIcon = (type) => {
        if (type === 'BLOG') return <FileText className="w-4 h-4" />;
        return <MessageCircle className="w-4 h-4" />;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'REVIEWED': return 'bg-blue-100 text-blue-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'DISMISSED': return 'bg-gray-100 text-gray-800';
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
                    <h1 className="text-2xl font-bold text-gray-900">Content Reports</h1>
                    <p className="text-gray-600 mt-1">Review and manage user-reported content</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="all">All Reports</option>
                    <option value="PENDING">Pending</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed</option>
                </select>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`p-2 rounded-full ${report.content_type === 'BLOG' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                    {getContentIcon(report.content_type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {report.content_type}: {report.content_title}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                        {report.content_preview}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span>Reported by: {report.reporter_name}</span>
                                        <span>Reason: {report.reason}</span>
                                        <span>Date: {new Date(report.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {report.description && (
                                        <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                                            <strong>Additional details:</strong> {report.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {report.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleResolve(report.id, 'resolve')}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => handleResolve(report.id, 'dismiss')}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                                        >
                                            Dismiss
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => router.push(`/moderator/reports/${report.id}/review`)}
                                    className="p-2 text-blue-600 hover:text-blue-800"
                                    title="Review Details"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {reports.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <Flag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No reports found</p>
                    </div>
                )}
            </div>
        </div>
    );
}