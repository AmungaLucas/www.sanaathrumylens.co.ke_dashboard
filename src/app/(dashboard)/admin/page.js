'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, FileText, Eye, Heart, MessageCircle,
    TrendingUp, Calendar, DollarSign, Shield, Settings,
    AlertCircle, CheckCircle, Clock, ArrowRight
} from 'lucide-react';
import StatsCard from '../_components/StatsCard';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        total_users: 0,
        total_admins: 0,
        total_posts: 0,
        total_events: 0,
        total_comments: 0,
        total_views: 0,
        total_likes: 0,
        pending_comments: 0,
        pending_reports: 0,
        monthly_revenue: 0,
        active_subscriptions: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                fetch('/api/dashboard/admin/stats'),
                fetch('/api/dashboard/admin/recent-activity'),
            ]);
            const statsData = await statsRes.json();
            const activityData = await activityRes.json();
            setStats(statsData);
            setRecentActivity(activityData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { title: 'Total Users', value: stats.total_users, icon: Users, color: 'blue' },
        { title: 'Total Posts', value: stats.total_posts, icon: FileText, color: 'green' },
        { title: 'Total Views', value: stats.total_views.toLocaleString(), icon: Eye, color: 'purple' },
        { title: 'Total Likes', value: stats.total_likes.toLocaleString(), icon: Heart, color: 'red' },
        { title: 'Total Comments', value: stats.total_comments, icon: MessageCircle, color: 'orange' },
        { title: 'Pending Comments', value: stats.pending_comments, icon: Clock, color: 'yellow' },
        { title: 'Pending Reports', value: stats.pending_reports, icon: AlertCircle, color: 'red' },
        { title: 'Monthly Revenue', value: `$${stats.monthly_revenue}`, icon: DollarSign, color: 'green' },
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Platform overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <a href="/admin/users" className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                            <Users className="w-4 h-4" /> Manage Users
                        </a>
                        <a href="/admin/content" className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                            <FileText className="w-4 h-4" /> Manage Content
                        </a>
                        <a href="/admin/categories" className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                            <FileText className="w-4 h-4" /> Categories
                        </a>
                        <a href="/admin/tags" className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition">
                            <FileText className="w-4 h-4" /> Tags
                        </a>
                        <a href="/admin/settings" className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                            <Settings className="w-4 h-4" /> System Settings
                        </a>
                        <a href="/admin/audit" className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition">
                            <Shield className="w-4 h-4" /> Audit Logs
                        </a>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className={`p-1 rounded-full ${activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                    activity.type === 'post' ? 'bg-green-100 text-green-600' :
                                        activity.type === 'comment' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {activity.type === 'user' && <Users className="w-3 h-3" />}
                                    {activity.type === 'post' && <FileText className="w-3 h-3" />}
                                    {activity.type === 'comment' && <MessageCircle className="w-3 h-3" />}
                                    {activity.type === 'settings' && <Settings className="w-3 h-3" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-700">{activity.message}</p>
                                    <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <a href="/admin/audit" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            View all logs <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}