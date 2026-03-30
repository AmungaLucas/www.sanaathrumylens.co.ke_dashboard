'use client';

import { useEffect, useState } from 'react';
import { FileText, Eye, Heart, MessageCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function AuthorDashboard() {
    const [stats, setStats] = useState({
        total_posts: 0,
        published_posts: 0,
        draft_posts: 0,
        pending_posts: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
    });
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchRecentPosts();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/author/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecentPosts = async () => {
        try {
            const res = await fetch('/api/dashboard/author/posts?limit=5');
            const data = await res.json();
            setRecentPosts(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { title: 'Total Posts', value: stats.total_posts, icon: FileText, color: 'blue' },
        { title: 'Published', value: stats.published_posts, icon: CheckCircle, color: 'green' },
        { title: 'Drafts', value: stats.draft_posts, icon: Clock, color: 'yellow' },
        { title: 'Pending', value: stats.pending_posts, icon: Clock, color: 'orange' },
        { title: 'Total Views', value: stats.total_views.toLocaleString(), icon: Eye, color: 'purple' },
        { title: 'Total Likes', value: stats.total_likes.toLocaleString(), icon: Heart, color: 'red' },
        { title: 'Total Comments', value: stats.total_comments.toLocaleString(), icon: MessageCircle, color: 'teal' },
    ];

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
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Author Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your content and track performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 text-blue-600',
                        green: 'bg-green-50 text-green-600',
                        yellow: 'bg-yellow-50 text-yellow-600',
                        orange: 'bg-orange-50 text-orange-600',
                        purple: 'bg-purple-50 text-purple-600',
                        red: 'bg-red-50 text-red-600',
                        teal: 'bg-teal-50 text-teal-600',
                    };
                    return (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
                        <a href="/author/posts" className="text-sm text-blue-600 hover:text-blue-800">
                            View all →
                        </a>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Title</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Views</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Likes</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Comments</th>
                                <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPosts.map((post) => (
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
                                    <td className="text-right py-3 px-6">
                                        <a href={`/author/posts/${post.id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm">
                                            Edit
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {recentPosts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-500">
                                        No posts yet. Create your first post!
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