'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Flag, AlertTriangle, CheckCircle, Clock, Eye, Shield, AlertCircle } from 'lucide-react';
import StatsCard from '../_components/StatsCard';

export default function ModeratorDashboard() {
    const [stats, setStats] = useState({
        pending_comments: 0,
        pending_reports: 0,
        active_warnings: 0,
        pending_appeals: 0,
        resolved_today: 0,
        spam_this_week: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, activitiesRes] = await Promise.all([
                fetch('/api/dashboard/moderator/stats'),
                fetch('/api/dashboard/moderator/recent-activity'),
            ]);

            if (!statsRes.ok) {
                throw new Error(`Stats API error: ${statsRes.status}`);
            }
            if (!activitiesRes.ok) {
                throw new Error(`Activity API error: ${activitiesRes.status}`);
            }

            const statsData = await statsRes.json();
            const activitiesData = await activitiesRes.json();

            setStats(statsData || {});
            setRecentActivities(Array.isArray(activitiesData) ? activitiesData : []);
        } catch (error) {
            console.error('Error fetching moderator data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { title: 'Pending Comments', value: stats.pending_comments || 0, icon: MessageCircle, color: 'yellow' },
        { title: 'Pending Reports', value: stats.pending_reports || 0, icon: Flag, color: 'red' },
        { title: 'Active Warnings', value: stats.active_warnings || 0, icon: AlertTriangle, color: 'orange' },
        { title: 'Pending Appeals', value: stats.pending_appeals || 0, icon: Clock, color: 'purple' },
        { title: 'Resolved Today', value: stats.resolved_today || 0, icon: CheckCircle, color: 'green' },
        { title: 'Spam (7d)', value: stats.spam_this_week || 0, icon: Shield, color: 'blue' },
    ];

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
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Moderator Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage comments, reports, and community safety</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <a href="/moderator/comments" className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition">
                            <MessageCircle className="w-4 h-4" />
                            Review Comments
                            {(stats.pending_comments || 0) > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                                    {stats.pending_comments}
                                </span>
                            )}
                        </a>
                        <a href="/moderator/reports" className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition">
                            <Flag className="w-4 h-4" />
                            Review Reports
                            {(stats.pending_reports || 0) > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
                                    {stats.pending_reports}
                                </span>
                            )}
                        </a>
                        <a href="/moderator/users" className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">
                            <AlertTriangle className="w-4 h-4" />
                            Flagged Users
                            {(stats.active_warnings || 0) > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white text-xs rounded-full">
                                    {stats.active_warnings}
                                </span>
                            )}
                        </a>
                        <a href="/moderator/appeals" className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                            <Clock className="w-4 h-4" />
                            Review Appeals
                            {(stats.pending_appeals || 0) > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                    {stats.pending_appeals}
                                </span>
                            )}
                        </a>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm">
                                    <div className={`p-1 rounded-full ${activity.type === 'comment' ? 'bg-yellow-100 text-yellow-600' :
                                        activity.type === 'report' ? 'bg-red-100 text-red-600' :
                                            activity.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                'bg-green-100 text-green-600'
                                        }`}>
                                        {activity.type === 'comment' && <MessageCircle className="w-3 h-3" />}
                                        {activity.type === 'report' && <Flag className="w-3 h-3" />}
                                        {activity.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                                        {activity.type === 'resolve' && <CheckCircle className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700">{activity.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}