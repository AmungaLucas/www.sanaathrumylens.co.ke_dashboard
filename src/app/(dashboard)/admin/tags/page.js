'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/dashboard/admin/tags');
            const data = res.headers.get('content-type')?.includes('application/json')
                ? await res.json()
                : null;

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to load tags');
            }

            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching tags:', error);
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this tag?')) {
            return;
        }

        try {
            const res = await fetch(`/api/dashboard/admin/tags/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchTags();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete tag');
            }
        } catch (error) {
            console.error('Error deleting tag:', error);
            alert('Failed to delete tag');
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
                    <p className="text-gray-600 mt-1">Manage content tags</p>
                </div>
                <Link
                    href="/admin/tags/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Tag
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTags.map((tag) => (
                    <div key={tag.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">#</span>
                                    <span className="font-medium text-gray-900">{tag.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Used in {tag.usage_count || 0} posts
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Link
                                    href={`/admin/tags/${tag.id}/edit`}
                                    className="p-2 text-blue-600 hover:text-blue-800"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(tag.id)}
                                    className="p-2 text-red-600 hover:text-red-800"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredTags.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No tags found. Create your first tag!
                </div>
            )}
        </div>
    );
}
