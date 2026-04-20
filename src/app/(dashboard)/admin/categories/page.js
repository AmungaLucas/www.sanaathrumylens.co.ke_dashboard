'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/dashboard/admin/categories');
            const data = res.headers.get('content-type')?.includes('application/json')
                ? await res.json()
                : null;

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to load categories');
            }

            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category? Posts in this category will be uncategorized.')) {
            return;
        }

        try {
            const res = await fetch(`/api/dashboard/admin/categories/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchCategories();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase())
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
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 mt-1">Manage content categories</p>
                </div>
                <Link
                    href="/admin/categories/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Category
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Slug</th>
                                <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Post Count</th>
                                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-6">
                                        <div>
                                            <p className="font-medium text-gray-900">{category.name}</p>
                                            {category.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{category.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <code className="text-xs text-gray-600">{category.slug}</code>
                                    </td>
                                    <td className="text-center py-3 px-6">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            {category.post_count || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`px-2 py-1 text-xs rounded-full ${category.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {category.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-right py-3 px-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/categories/${category.id}/edit`}
                                                className="p-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL}/categories/${category.slug}`}
                                                target="_blank"
                                                className="p-1 text-gray-600 hover:text-gray-800"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-gray-500">
                                        No categories found. Create your first category!
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
