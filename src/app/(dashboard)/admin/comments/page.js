'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle, CheckCircle, XCircle, Trash2, AlertCircle, Search } from 'lucide-react';

export default function AdminCommentsPage() {
    const router = useRouter();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchComments();
    }, [filter]);

    const fetchComments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/dashboard/moderator/comments?status=${filter}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
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
            if (res.ok) fetchComments();
            else {
                const err = await res.json();
                toast.error(err.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Action failed');
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

    const filteredComments = comments.filter(c =>
        c.content?.toLowerCase().includes(search.toLowerCase()) ||
        c.author_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.blog_title?.toLowerCase().includes(search.toLowerCase())
    );

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
                <button onClick={fetchComments} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
                    <p className="text-gray-600 mt-1">Manage all user comments</p>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Comments</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SPAM">Spam</option>
                    <option value="TRASHED">Trashed</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search comments..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Comment</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Author</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Blog</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComments.length > 0 ? (
                                filteredComments.map((comment) => (
                                    <tr key={comment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <p className="text-gray-900 line-clamp-2 max-w-md">{comment.content}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-gray-900">{comment.author_name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-blue-600 hover:underline line-clamp-1">{comment.blog_title}</span>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(comment.status)}`}>{comment.status}</span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {comment.status === 'PENDING' && (
                                                    <>
                                                        <button onClick={() => handleAction(comment.id, 'approve')} className="p-1 text-green-600 hover:text-green-800" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                                                        <button onClick={() => handleAction(comment.id, 'spam')} className="p-1 text-red-600 hover:text-red-800" title="Mark as Spam"><XCircle className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                {comment.status !== 'TRASHED' && (
                                                    <button onClick={() => handleAction(comment.id, 'trash')} className="p-1 text-gray-500 hover:text-gray-700" title="Trash"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-500">
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
