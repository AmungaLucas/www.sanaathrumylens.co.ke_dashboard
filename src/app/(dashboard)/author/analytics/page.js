'use client';

import { useEffect, useState } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Eye, Heart, MessageCircle } from 'lucide-react';

export default function AuthorAnalytics() {
    const [performanceData, setPerformanceData] = useState([]);
    const [topPosts, setTopPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const [perfRes, topRes] = await Promise.all([
                fetch(`/api/dashboard/author/analytics?days=${period}`),
                fetch('/api/dashboard/author/top-posts')
            ]);
            const perfData = await perfRes.json();
            const topData = await topRes.json();
            setPerformanceData(perfData);
            setTopPosts(topData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalViews = performanceData.reduce((sum, day) => sum + day.views, 0);
    const totalLikes = performanceData.reduce((sum, day) => sum + day.likes, 0);
    const totalComments = performanceData.reduce((sum, day) => sum + day.comments, 0);

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
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">Track your content performance</p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 mb-6">
                {[7, 30, 90].map((days) => (
                    <button
                        key={days}
                        onClick={() => setPeriod(days)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === days.toString()
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Last {days} Days
                    </button>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Views</p>
                            <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Likes</p>
                            <p className="text-2xl font-bold text-gray-900">{totalLikes.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-full">
                            <Heart className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Comments</p>
                            <p className="text-2xl font-bold text-gray-900">{totalComments.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                            <MessageCircle className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                            name="Views"
                        />
                        <Area
                            type="monotone"
                            dataKey="likes"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.1}
                            name="Likes"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Top Performing Posts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Top Performing Posts</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Title</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Views</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Likes</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Comments</th>
                                <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">Engagement Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topPosts.map((post, index) => (
                                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-6">
                                        <span className="text-gray-900 font-medium">
                                            {index + 1}. {post.title}
                                        </span>
                                    </td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.view_count?.toLocaleString() || 0}</td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.like_count?.toLocaleString() || 0}</td>
                                    <td className="text-center py-3 px-6 text-gray-600">{post.comment_count?.toLocaleString() || 0}</td>
                                    <td className="text-right py-3 px-6">
                                        <span className="text-green-600 font-medium">
                                            {(((post.like_count + post.comment_count) / post.view_count) * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}