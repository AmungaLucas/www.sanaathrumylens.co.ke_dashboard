'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';

export default function AuthorPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPosts();
    }, [filter]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/dashboard/author/posts?status=${filter}`);
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await fetch(`/api/dashboard/author/posts/${id}`, { method: 'DELETE' });
                fetchPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status) => {
        const colors = {
            'PUBLISHED': 'bg-green-100 text-green-800',
            'DRAFT': 'bg-gray-100 text-gray-800',
            'PENDING_REVIEW': 'bg-yellow-100 text-yellow-800',
            'ARCHIVED': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Posts</h1>
                    <p className="text-gray-600 mt-1">Manage all your articles</p>
                </div>
                <Link
                    href="/author/posts/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Create New Post
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'PUBLISHED', 'DRAFT', 'PENDING_REVIEW'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Title</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Views</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Likes</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Comments</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Date</th>
                                <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-6">
                                        <a href={`/author/posts/${post.id}/edit`} className="text-gray-900 font-medium hover:text-blue-600">
                                            {post.title}
                                        </a>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(post.status)}`}>
                                            {post.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.view_count?.toLocaleString() || 0}</td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.like_count?.toLocaleString() || 0}</td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.comment_count?.toLocaleString() || 0}</td>
                                    <td className="text-center py-3 px-6 text-gray-600">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="text-right py-3 px-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <a
                                                href={`/author/posts/${post.id}/edit`}
                                                className="p-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {post.status === 'PUBLISHED' && (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL}/blogs/${post.slug}`}
                                                    target="_blank"
                                                    className="p-1 text-gray-600 hover:text-gray-800"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-500">
                                        No posts found. Create your first post!
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