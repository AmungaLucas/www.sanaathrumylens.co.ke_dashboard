'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

export default function TagSelector({ selectedIds = [], onChange }) {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/dashboard/author/categories-tags');
            const data = await res.json();
            setTags(data.tags || []);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tagId) => {
        if (selectedIds.includes(tagId)) {
            onChange(selectedIds.filter(id => id !== tagId));
        } else {
            onChange([...selectedIds, tagId]);
        }
    };

    const createTag = async () => {
        if (!newTagName.trim()) return;

        setCreating(true);
        try {
            const slug = newTagName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const res = await fetch('/api/dashboard/admin/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName, slug }),
            });

            if (res.ok) {
                const data = await res.json();
                const newTag = { id: data.id, name: newTagName, slug };
                setTags([...tags, newTag]);
                onChange([...selectedIds, newTag.id]);
                setNewTagName('');
                setShowNewTagInput(false);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to create tag');
            }
        } catch (error) {
            console.error('Error creating tag:', error);
            toast.error('Failed to create tag');
        } finally {
            setCreating(false);
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedTags = tags.filter(tag => selectedIds.includes(tag.id));

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
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                        >
                            #{tag.name}
                            <button
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="hover:text-purple-900"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search or add tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                    type="button"
                    onClick={() => setShowNewTagInput(!showNewTagInput)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Add new tag"
                >
                    <Plus className="w-4 h-4 text-gray-600" />
                </button>
            </div>

            {/* New Tag Input */}
            {showNewTagInput && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={createTag}
                        disabled={creating || !newTagName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {creating ? '...' : 'Add'}
                    </button>
                </div>
            )}

            {/* Tags List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredTags.length > 0 ? (
                    filteredTags.map(tag => (
                        <label
                            key={tag.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(tag.id)}
                                onChange={() => toggleTag(tag.id)}
                                className="w-4 h-4 text-purple-600 rounded"
                            />
                            <span className="text-sm text-gray-700">#{tag.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">
                                {tag.usage_count || 0} posts
                            </span>
                        </label>
                    ))
                ) : (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No tags found. Click + to create a new tag.
                    </div>
                )}
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500">
                Select existing tags or create new ones for better content discovery
            </p>
        </div>
    );
}