'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EditorAnalyticsPage() {
    const [stats, setStats] = useState({
        pending_reviews: 0,
        scheduled_posts: 0,
        published_this_week: 0,
        active_authors: 1,
        total_posts: 0,
        avg_views: 0,
        avg_engagement: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/editor/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching editor stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    const statCards = [
        { title: 'Total Posts', value: stats.total_posts || 0, color: 'bg-blue-50 text-blue-700' },
        { title: 'Pending Reviews', value: stats.pending_reviews || 0, color: 'bg-yellow-50 text-yellow-700' },
        { title: 'Scheduled Posts', value: stats.scheduled_posts || 0, color: 'bg-purple-50 text-purple-700' },
        { title: 'Published This Week', value: stats.published_this_week || 0, color: 'bg-green-50 text-green-700' },
        { title: 'Active Authors', value: stats.active_authors || 0, color: 'bg-indigo-50 text-indigo-700' },
        { title: 'Avg Views/Post', value: stats.avg_views || 0, color: 'bg-orange-50 text-orange-700' },
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editor Analytics</h1>
                <p className="text-gray-600 mt-1">Content performance and editorial metrics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className={`${stat.color} rounded-xl p-6`}>
                        <p className="text-sm font-medium opacity-80">{stat.title}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Summary</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                        <span className="text-gray-600">Average Engagement Rate</span>
                        <span className="font-semibold text-gray-900">{stats.avg_engagement || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                        <span className="text-gray-600">Pending Assignments</span>
                        <span className="font-semibold text-gray-900">{stats.pending_assignments || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600">Monthly Views</span>
                        <span className="font-semibold text-gray-900">{stats.monthly_views || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
