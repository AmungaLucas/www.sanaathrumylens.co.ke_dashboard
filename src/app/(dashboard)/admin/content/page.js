'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function ContentOverviewPage() {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('blog');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchContent();
    }, [type, search, status, page]);

    const fetchContent = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/content?type=${type}&search=${search}&status=${status}&page=${page}`);
            const data = await res.json();
            setContent(data.items);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!confirm(`Are you sure you want to ${action} this item?`)) return;
        try {
            const res = await fetch(`/api/dashboard/admin/content/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, type }),
            });
            if (res.ok) fetchContent();
            else toast.error('Action failed');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Action failed');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
            DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
            PENDING_REVIEW: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
            ARCHIVED: { label: 'Archived', color: 'bg-red-100 text-red-800' },
        };
        const { label, color } = config[status] || { label: status, color: 'bg-gray-100' };
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>;
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Content Overview</h1><p className="text-gray-600">Manage all content</p></div>
                <div className="flex gap-3">
                    <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2">
                        <option value="blog">Blog Posts</option>
                        <option value="event">Events</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div></div>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2">
                        <option value="all">All Status</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="SCHEDULED">Scheduled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-3 px-6">Title</th>
                            <th className="text-left py-3 px-6">Author</th>
                            <th className="text-left py-3 px-6">Status</th>
                            <th className="text-left py-3 px-6">Date</th>
                            <th className="text-center py-3 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {content.map(item => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-6"><div><p className="font-medium">{item.title}</p><p className="text-xs text-gray-500">{item.slug}</p></div></td>
                                <td className="py-3 px-6">{item.author_name || 'N/A'}</td>
                                <td className="py-3 px-6">{getStatusBadge(item.status)}</td>
                                <td className="py-3 px-6 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                <td className="text-center py-3 px-6">
                                    <div className="flex justify-center gap-2">
                                        <a href={`/${type === 'blog' ? 'blogs' : 'events'}/${item.slug}`} target="_blank" className="p-1 text-blue-600"><Eye className="w-4 h-4" /></a>
                                        {item.status !== 'PUBLISHED' && (<button onClick={() => handleAction(item.id, 'publish')} className="p-1 text-green-600"><CheckCircle className="w-4 h-4" /></button>)}
                                        {item.status !== 'ARCHIVED' && (<button onClick={() => handleAction(item.id, 'archive')} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button>)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && <div className="flex justify-center gap-2 mt-6"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">Prev</button><span className="px-3 py-1">{page}/{totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">Next</button></div>}
        </div>
    );
}