'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, CheckCircle, XCircle, Flag, Eye, Trash2, AlertCircle } from 'lucide-react';

export default function CommentModerationPage() {
    const router = useRouter();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedComments, setSelectedComments] = useState([]);
    const [bulkAction, setBulkAction] = useState('');

    useEffect(() => {
        fetchComments();
    }, [filter]);

    const fetchComments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/dashboard/moderator/comments?status=${filter}`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // Ensure data is an array
            if (Array.isArray(data)) {
                setComments(data);
            } else if (data && Array.isArray(data.comments)) {
                setComments(data.comments);
            } else if (data && typeof data === 'object') {
                // If API returns an object, try to find the array
                const possibleArray = Object.values(data).find(val => Array.isArray(val));
                setComments(possibleArray || []);
            } else {
                setComments([]);
                console.warn('Unexpected data format:', data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError(error.message || 'Failed to fetch comments');
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (commentId, action) => {
        try {
            const res = await fetch(`/api/dashboard/moderator/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                fetchComments();
            } else {
                const error = await res.json();
                alert(error.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Action failed');
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedComments.length === 0) return;

        if (!confirm(`Are you sure you want to ${bulkAction} ${selectedComments.length} comment(s)?`)) return;

        try {
            const res = await fetch('/api/dashboard/moderator/comments/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentIds: selectedComments, action: bulkAction }),
            });

            if (res.ok) {
                setSelectedComments([]);
                setBulkAction('');
                fetchComments();
            } else {
                const error = await res.json();
                alert(error.error || 'Bulk action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Bulk action failed');
        }
    };

    const toggleSelect = (commentId) => {
        setSelectedComments(prev =>
            prev.includes(commentId)
                ? prev.filter(id => id !== commentId)
                : [...prev, commentId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedComments.length === comments.length && comments.length > 0) {
            setSelectedComments([]);
        } else {
            setSelectedComments(comments.map(c => c.id));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'SPAM': return 'bg-red-100 text-red-800';
            case 'TRASHED': return 'bg-gray-100 text-gray-800';
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

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Comments</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchComments}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Comment Moderation</h1>
                    <p className="text-gray-600 mt-1">Review and manage user comments</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="all">All Comments</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="SPAM">Spam</option>
                        <option value="TRASHED">Trashed</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedComments.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                        {selectedComments.length} comment(s) selected
                    </span>
                    <div className="flex items-center gap-3">
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            className="px-3 py-1 border border-blue-300 rounded-lg text-sm bg-white"
                        >
                            <option value="">Bulk Actions</option>
                            <option value="approve">Approve</option>
                            <option value="spam">Mark as Spam</option>
                            <option value="trash">Move to Trash</option>
                        </select>
                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Comments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="w-8 py-3 px-4">
                                    {comments.length > 0 && (
                                        <input
                                            type="checkbox"
                                            checked={selectedComments.length === comments.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                    )}
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Comment</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Author</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Blog</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(comments) && comments.length > 0 ? (
                                comments.map((comment) => (
                                    <tr key={comment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedComments.includes(comment.id)}
                                                onChange={() => toggleSelect(comment.id)}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="max-w-md">
                                                <p className="text-gray-900 line-clamp-2">{comment.content}</p>
                                                {comment.reply_to && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Reply to: {comment.reply_to}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={comment.avatar_url || '/default-avatar.png'}
                                                    alt={comment.author_name}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                                <span className="text-sm text-gray-900">{comment.author_name}</span>
                                                {comment.user_id && (
                                                    <span className="text-xs text-blue-600">(registered)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL}/blogs/${comment.blog_slug}`}
                                                target="_blank"
                                                className="text-sm text-blue-600 hover:underline line-clamp-1"
                                            >
                                                {comment.blog_title}
                                            </a>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(comment.status)}`}>
                                                {comment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {comment.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(comment.id, 'approve')}
                                                            className="p-1 text-green-600 hover:text-green-800"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(comment.id, 'spam')}
                                                            className="p-1 text-red-600 hover:text-red-800"
                                                            title="Mark as Spam"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {comment.status !== 'TRASHED' && (
                                                    <button
                                                        onClick={() => handleAction(comment.id, 'trash')}
                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                        title="Move to Trash"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/moderator/comments/${comment.id}/review`)}
                                                    className="p-1 text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No comments found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}