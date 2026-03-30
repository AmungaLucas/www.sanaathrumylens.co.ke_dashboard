'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function CategorySelector({ selectedIds = [], onChange }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/dashboard/author/categories-tags');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId) => {
        if (selectedIds.includes(categoryId)) {
            onChange(selectedIds.filter(id => id !== categoryId));
        } else {
            onChange([...selectedIds, categoryId]);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCategories = categories.filter(cat => selectedIds.includes(cat.id));

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(cat => (
                        <span
                            key={cat.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        >
                            {cat.name}
                            <button
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className="hover:text-blue-900"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />

            {/* Categories List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                        <label
                            key={cat.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{cat.name}</span>
                        </label>
                    ))
                ) : (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No categories found
                    </div>
                )}
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500">
                Select one or more categories for your post
            </p>
        </div>
    );
}