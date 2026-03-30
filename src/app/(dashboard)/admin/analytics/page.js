'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
    const [data, setData] = useState({
        userGrowth: [],
        contentPerformance: [],
        trafficSources: [],
        revenueData: [],
        topPosts: [],
    });
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/analytics?period=${period}`);
            const analytics = await res.json();
            setData(analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Analytics Dashboard</h1><p className="text-gray-600">Platform performance metrics</p></div>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded-lg px-3 py-2">
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">User Growth</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Content Performance</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.contentPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="views" fill="#3b82f6" />
                            <Bar dataKey="likes" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Traffic Sources</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={data.trafficSources} dataKey="value" nameKey="source" cx="50%" cy="50%" outerRadius={100} label>
                                {data.trafficSources.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Revenue (Monthly)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Top Performing Posts</h2>
                <table className="w-full">
                    <thead className="border-b">
                        <tr><th className="text-left py-2">Title</th><th className="text-left">Author</th><th className="text-center">Views</th><th className="text-center">Likes</th><th className="text-center">Comments</th></tr>
                    </thead>
                    <tbody>
                        {data.topPosts.map(post => (
                            <tr key={post.id} className="border-b">
                                <td className="py-2"><a href={`/blogs/${post.slug}`} target="_blank" className="text-blue-600 hover:underline">{post.title}</a></td>
                                <td>{post.author_name}</td>
                                <td className="text-center">{post.view_count.toLocaleString()}</td>
                                <td className="text-center">{post.like_count.toLocaleString()}</td>
                                <td className="text-center">{post.comment_count.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}