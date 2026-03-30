'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, CheckCircle, Clock, AlertCircle, User, Calendar, MessageSquare } from 'lucide-react';

export default function AssignmentsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');

    useEffect(() => {
        fetchAssignments();
    }, [filter]);

    const fetchAssignments = async () => {
        try {
            const res = await fetch(`/api/dashboard/editor/assignments?status=${filter}`);
            const data = await res.json();
            setAssignments(data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
            IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
            SUBMITTED: { label: 'Submitted', color: 'bg-green-100 text-green-800' },
            COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
            DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-800' },
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Author Assignments</h1>
                    <p className="text-gray-600 mt-1">Assign topics and track progress</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="active">Active Assignments</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                        <option value="all">All</option>
                    </select>
                    <a
                        href="/editor/assignments/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        New Assignment
                    </a>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-gray-900">{assignment.topic}</h3>
                                    {getStatusBadge(assignment.status)}
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        <span>Assigned to: {assignment.author_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                                    </div>
                                    {assignment.submitted_at && (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push(`/editor/assignments/${assignment.id}`)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    View Details
                                </button>
                                {assignment.status === 'SUBMITTED' && (
                                    <button
                                        onClick={() => router.push(`/editor/queue/${assignment.blog_id}/review`)}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                    >
                                        Review
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {assignments.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No assignments found</p>
                        <a href="/editor/assignments/new" className="mt-3 inline-block text-blue-600 hover:text-blue-800">
                            Create your first assignment →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}