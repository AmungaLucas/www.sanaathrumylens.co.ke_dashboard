'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Send, Eye, AlertCircle } from 'lucide-react';
import TipTapEditor from '@/app/(dashboard)/_components/TipTapEditor';

export default function ReviewPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [feedbackType, setFeedbackType] = useState('GENERAL');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('content');

    useEffect(() => {
        fetchPost();
    }, []);

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/dashboard/editor/posts/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                alert('Post not found');
                router.push('/editor/queue');
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewAction = async (action) => {
        if (!feedback && action === 'changes_requested') {
            alert('Please provide feedback for requested changes');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/dashboard/editor/posts/${postId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, feedback, feedback_type: feedbackType }),
            });

            if (res.ok) {
                router.push('/editor/queue');
            } else {
                const error = await res.json();
                alert(error.error || 'Action failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!post) return null;

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
                    <h1 className="text-2xl font-bold text-gray-900">Review Post</h1>
                    <p className="text-gray-600 mt-1">Review and provide feedback on submitted content</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'content'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Content
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'preview'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Preview
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'history'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Revision History
                        </button>
                    </div>

                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>By {post.author_name}</span>
                                    <span>•</span>
                                    <span>Submitted: {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {post.featured_image && (
                                <div className="mb-6">
                                    <img
                                        src={post.featured_image}
                                        alt={post.title}
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    )}

                    {/* Preview Tab */}
                    {activeTab === 'preview' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700">This is a preview of how the post will appear on the live site</p>
                            </div>
                            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Revision History</h3>
                            <div className="space-y-3">
                                {post.revisions?.map((rev, index) => (
                                    <div key={rev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {rev.revision_message || `Version ${post.revisions.length - index}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(rev.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Review Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Review Actions</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Feedback Type
                                </label>
                                <select
                                    value={feedbackType}
                                    onChange={(e) => setFeedbackType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="GENERAL">General Feedback</option>
                                    <option value="SEO">SEO Suggestions</option>
                                    <option value="STRUCTURE">Structure & Flow</option>
                                    <option value="FACT_CHECK">Fact Check</option>
                                    <option value="STYLE">Style & Tone</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Feedback / Notes
                                </label>
                                <textarea
                                    rows="4"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide your feedback, suggestions, or required changes..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleReviewAction('approve')}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReviewAction('changes_requested')}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Request Changes
                                </button>
                                <button
                                    onClick={() => handleReviewAction('reject')}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Post Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Post Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className="font-medium">{post.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Category:</span>
                                <span>{post.categories?.join(', ') || 'None'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tags:</span>
                                <span>{post.tags?.join(', ') || 'None'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Word Count:</span>
                                <span>{post.word_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Reading Time:</span>
                                <span>{post.reading_time} min</span>
                            </div>
                        </div>
                    </div>

                    {/* SEO Check */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">SEO Check</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Meta Title</span>
                                <span className={`text-xs ${post.meta_title ? 'text-green-600' : 'text-red-600'}`}>
                                    {post.meta_title ? `${post.meta_title.length}/60` : 'Missing'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Meta Description</span>
                                <span className={`text-xs ${post.meta_description ? 'text-green-600' : 'text-red-600'}`}>
                                    {post.meta_description ? `${post.meta_description.length}/160` : 'Missing'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Featured Image</span>
                                <span className={`text-xs ${post.featured_image ? 'text-green-600' : 'text-red-600'}`}>
                                    {post.featured_image ? 'Present' : 'Missing'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Slug</span>
                                <span className="text-xs text-gray-500">{post.slug}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}