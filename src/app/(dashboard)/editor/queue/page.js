'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Eye, CheckCircle, XCircle, Filter, Search, Calendar, User } from 'lucide-react';

export default function ReviewQueuePage() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');

    useEffect(() => {
        fetchPosts();
    }, [filter, sortBy]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/dashboard/editor/pending?status=${filter}&sort=${sortBy}`);
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.author_name.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
            IN_REVIEW: { label: 'In Review', color: 'bg-blue-100 text-blue-800' },
            CHANGES_REQUESTED: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-800' },
            APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
        };
        const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.label}</span>;
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
                    <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
                    <p className="text-gray-600 mt-1">Review and manage submitted content</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="CHANGES_REQUESTED">Changes Requested</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="created_at">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title">Title A-Z</option>
                    </select>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Title</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Author</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Submitted</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-6">
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={post.author_avatar || '/default-avatar.png'}
                                                alt={post.author_name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className="text-sm text-gray-900">{post.author_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        {getStatusBadge(post.status)}
                                    </td>
                                    <td className="py-3 px-6 text-sm text-gray-500">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="text-center py-3 px-6">
                                        <button
                                            onClick={() => router.push(`/editor/queue/${post.id}/review`)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                                        <p>No posts in review queue</p>
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