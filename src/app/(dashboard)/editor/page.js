'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock, FileText, Users, CheckCircle, Eye,
    Calendar, TrendingUp, AlertCircle, ArrowRight
} from 'lucide-react';
import StatsCard from '../_components/StatsCard';

export default function EditorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        pending_reviews: 0,
        scheduled_posts: 0,
        published_this_week: 0,
        active_authors: 0,
        total_posts: 0,
        pending_assignments: 0,
    });
    const [pendingReviews, setPendingReviews] = useState([]);
    const [recentPublished, setRecentPublished] = useState([]);
    const [upcomingSchedule, setUpcomingSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, pendingRes, publishedRes, scheduleRes] = await Promise.all([
                fetch('/api/dashboard/editor/stats'),
                fetch('/api/dashboard/editor/pending?limit=5'),
                fetch('/api/dashboard/editor/recent-published?limit=5'),
                fetch('/api/dashboard/editor/upcoming?limit=5'),
            ]);

            const statsData = await statsRes.json();
            const pendingData = await pendingRes.json();
            const publishedData = await publishedRes.json();
            const scheduleData = await scheduleRes.json();

            setStats(statsData);
            setPendingReviews(pendingData);
            setRecentPublished(publishedData);
            setUpcomingSchedule(scheduleData);
        } catch (error) {
            console.error('Error fetching editor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { title: 'Pending Reviews', value: stats.pending_reviews, icon: Clock, color: 'yellow' },
        { title: 'Scheduled Posts', value: stats.scheduled_posts, icon: Calendar, color: 'blue' },
        { title: 'Published This Week', value: stats.published_this_week, icon: CheckCircle, color: 'green' },
        { title: 'Active Authors', value: stats.active_authors, icon: Users, color: 'purple' },
        { title: 'Total Posts', value: stats.total_posts, icon: FileText, color: 'gray' },
        { title: 'Pending Assignments', value: stats.pending_assignments, icon: AlertCircle, color: 'orange' },
    ];

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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Editor Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage content pipeline, reviews, and editorial calendar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="/editor/queue"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition"
                        >
                            <Clock className="w-4 h-4" />
                            Review Queue
                            {stats.pending_reviews > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                                    {stats.pending_reviews}
                                </span>
                            )}
                        </a>
                        <a
                            href="/editor/calendar"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                        >
                            <Calendar className="w-4 h-4" />
                            Editorial Calendar
                        </a>
                        <a
                            href="/editor/assignments"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
                        >
                            <Users className="w-4 h-4" />
                            Assign Topics
                        </a>
                        <a
                            href="/editor/authors"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                        >
                            <Users className="w-4 h-4" />
                            Manage Authors
                        </a>
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h2>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Average views per post</span>
                        <span className="text-lg font-bold text-gray-900">{stats.avg_views?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Average engagement rate</span>
                        <span className="text-lg font-bold text-gray-900">{stats.avg_engagement || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total views this month</span>
                        <span className="text-lg font-bold text-gray-900">{stats.monthly_views?.toLocaleString() || 0}</span>
                    </div>
                </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Reviews */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Pending Reviews</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pendingReviews.length > 0 ? (
                            pendingReviews.map((review) => (
                                <div key={review.id} className="p-4 hover:bg-gray-50 transition">
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                        {review.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">By {review.author_name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/editor/queue/${review.id}/review`)}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        Review <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p>No pending reviews</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <a href="/editor/queue" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                            View all pending reviews <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Recent Published */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Recently Published</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentPublished.length > 0 ? (
                            recentPublished.map((post) => (
                                <div key={post.id} className="p-4 hover:bg-gray-50 transition">
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">By {post.author_name}</span>
                                        <span className="text-xs text-green-600">
                                            {new Date(post.published_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span>👁️ {post.view_count?.toLocaleString() || 0}</span>
                                        <span>❤️ {post.like_count?.toLocaleString() || 0}</span>
                                        <span>💬 {post.comment_count?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No recent publications</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <a href="/editor/content" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                            View all content <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Upcoming Schedule</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {upcomingSchedule.length > 0 ? (
                            upcomingSchedule.map((post) => (
                                <div key={post.id} className="p-4 hover:bg-gray-50 transition">
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">By {post.author_name}</span>
                                        <span className="text-xs text-blue-600">
                                            {new Date(post.scheduled_for).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/editor/queue/${post.id}/review`)}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Edit Schedule
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No upcoming scheduled posts</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <a href="/editor/calendar" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1">
                            View full calendar <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}