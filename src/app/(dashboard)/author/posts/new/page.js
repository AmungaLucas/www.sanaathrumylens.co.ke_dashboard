'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import TipTapEditor from '../../../_components/TipTapEditor';
import StatusBadge from '../../../_components/StatusBadge';
import CategorySelector from '../../../_components/CategorySelector';
import TagSelector from '../../../_components/TagSelector';

export default function CreatePostPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [categoryIds, setCategoryIds] = useState([]);
    const [tagIds, setTagIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const generateSlug = (titleText) => {
        return titleText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (!slug || slug === generateSlug(title)) {
            setSlug(generateSlug(newTitle));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const postData = {
            title,
            slug,
            excerpt,
            content,
            featured_image: featuredImage,
            status,
            category_ids: categoryIds,
            tag_ids: tagIds,
        };

        try {
            const res = await fetch('/api/dashboard/author/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (res.ok) {
                router.push('/author/posts');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
                        <p className="text-gray-600 mt-1">Write and publish your article</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setStatus('DRAFT')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${status === 'DRAFT'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Save Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus('PENDING_REVIEW')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${status === 'PENDING_REVIEW'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                    >
                        Submit for Review
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {loading ? 'Saving...' : 'Publish'}
                    </button>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                placeholder="Post Title"
                                value={title}
                                onChange={handleTitleChange}
                                className="w-full text-3xl font-bold border-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                                required
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL Slug
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">
                                    {process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}/blogs/
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

                        {/* Featured Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Featured Image URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={featuredImage}
                                    onChange={(e) => setFeaturedImage(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            {featuredImage && (
                                <div className="mt-2">
                                    <img
                                        src={featuredImage}
                                        alt="Preview"
                                        className="h-32 w-auto object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Excerpt / Summary
                            </label>
                            <textarea
                                rows="3"
                                placeholder="A brief summary of your article..."
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* TipTap Editor */}
                        <TipTapEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Write your amazing content here..."
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Post Status</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="DRAFT"
                                        checked={status === 'DRAFT'}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Draft</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="PENDING_REVIEW"
                                        checked={status === 'PENDING_REVIEW'}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-4 h-4 text-yellow-600"
                                    />
                                    <span className="text-sm text-gray-700">Pending Review</span>
                                </label>
                            </div>
                        </div>

                        {/* Current Status Badge */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Current Status</h3>
                            <StatusBadge status={status} />
                        </div>

                        {/* Categories Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                            <CategorySelector
                                selectedIds={categoryIds}
                                onChange={setCategoryIds}
                            />
                        </div>

                        {/* Tags Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
                            <TagSelector
                                selectedIds={tagIds}
                                onChange={setTagIds}
                            />
                        </div>

                        {/* SEO Preview Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">SEO Preview</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-blue-600 text-sm hover:underline cursor-pointer">
                                        {title || 'Post Title'}
                                    </p>
                                    <p className="text-green-700 text-xs">
                                        {process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}/blogs/{slug || 'post-slug'}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                        {excerpt || 'A brief summary of your article...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}