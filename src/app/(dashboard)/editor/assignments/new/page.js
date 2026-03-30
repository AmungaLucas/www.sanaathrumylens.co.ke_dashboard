'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Calendar } from 'lucide-react';

export default function NewAssignmentPage() {
    const router = useRouter();
    const [authors, setAuthors] = useState([]);
    const [formData, setFormData] = useState({
        author_id: '',
        topic: '',
        description: '',
        deadline: '',
    });
    const [loading, setLoading] = useState(false);
    const [fetchingAuthors, setFetchingAuthors] = useState(true);

    useEffect(() => {
        fetchAuthors();
    }, []);

    const fetchAuthors = async () => {
        try {
            const res = await fetch('/api/dashboard/editor/authors');
            const data = await res.json();
            setAuthors(data);
        } catch (error) {
            console.error('Error fetching authors:', error);
        } finally {
            setFetchingAuthors(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/dashboard/editor/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/editor/assignments');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create assignment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (fetchingAuthors) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
                    <p className="text-gray-600 mt-1">Assign a topic to an author</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Author Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Author *
                        </label>
                        <select
                            name="author_id"
                            value={formData.author_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select an author</option>
                            {authors.map((author) => (
                                <option key={author.id} value={author.id}>
                                    {author.name} ({author.total_posts} posts)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Topic / Title *
                        </label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            placeholder="e.g., The Future of Sustainable Architecture"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description / Guidelines
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Provide detailed instructions, key points to cover, tone, and any specific requirements..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deadline *
                        </label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Submit Button */}
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
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}