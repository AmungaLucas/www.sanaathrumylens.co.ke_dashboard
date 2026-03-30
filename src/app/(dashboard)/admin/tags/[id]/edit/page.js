'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditTagPage() {
    const router = useRouter();
    const params = useParams();
    const tagId = params.id;

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTag();
    }, []);

    const fetchTag = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/tags/${tagId}`);
            if (res.ok) {
                const tag = await res.json();
                setName(tag.name);
                setSlug(tag.slug);
                setDescription(tag.description || '');
            } else {
                alert('Tag not found');
                router.push('/admin/tags');
            }
        } catch (error) {
            console.error('Error fetching tag:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        if (!slug || slug === generateSlug(name)) {
            setSlug(generateSlug(newName));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/dashboard/admin/tags/${tagId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, description }),
            });

            if (res.ok) {
                router.push('/admin/tags');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update tag');
            }
        } catch (error) {
            console.error('Error updating tag:', error);
            alert('Failed to update tag');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Tag</h1>
                    <p className="text-gray-600 mt-1">Update tag details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tag Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">
                                {process.env.NEXT_PUBLIC_MAIN_SITE_URL}/tags/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}