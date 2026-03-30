'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle, AlertCircle, FileText, Eye, Hash } from 'lucide-react';

export default function StyleGuidePage() {
    const [activeSection, setActiveSection] = useState('overview');

    const sections = {
        overview: {
            title: 'Editorial Overview',
            content: (
                <div className="space-y-4">
                    <p className="text-gray-700">Sanaa Thru My Lens celebrates Kenya&apos;s creative ecosystem. Our content should reflect the diversity, innovation, and cultural richness of our community.</p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Our Voice</h4>
                        <p className="text-blue-800 text-sm">Knowledgeable, passionate, and accessible. We write for both experts and newcomers to Kenya&apos;s creative scene.</p>
                    </div>
                </div>
            ),
        },
        seo: {
            title: 'SEO Checklist',
            content: (
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900">Meta Title (50-60 characters)</h4>
                            <p className="text-sm text-gray-600">Include primary keyword, keep engaging</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900">Meta Description (150-160 characters)</h4>
                            <p className="text-sm text-gray-600">Summarize article, include call-to-action</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900">URL Slug</h4>
                            <p className="text-sm text-gray-600">Short, descriptive, lowercase with hyphens</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900">Featured Image</h4>
                            <p className="text-sm text-gray-600">High quality, relevant, with alt text</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-gray-900">Internal Links</h4>
                            <p className="text-sm text-gray-600">Link to 2-3 related articles on the site</p>
                        </div>
                    </div>
                </div>
            ),
        },
        formatting: {
            title: 'Formatting Rules',
            content: (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Headings Structure</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            <li>H1: Article title only</li>
                            <li>H2: Main section headers</li>
                            <li>H3: Sub-sections under H2</li>
                            <li>Avoid skipping heading levels</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Paragraphs</h4>
                        <p className="text-sm text-gray-600">Keep paragraphs short (3-4 sentences max). Use line breaks for readability.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Lists</h4>
                        <p className="text-sm text-gray-600">Use bullet points for lists of 3+ items. Numbered lists for step-by-step instructions.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Images</h4>
                        <p className="text-sm text-gray-600">Include alt text for accessibility. Caption relevant images. Minimum width 800px.</p>
                    </div>
                </div>
            ),
        },
        tone: {
            title: 'Tone & Voice',
            content: (
                <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Do</h4>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                            <li>Use active voice</li>
                            <li>Be conversational and engaging</li>
                            <li>Include quotes from experts and community members</li>
                            <li>Use Kenyan English and local references appropriately</li>
                            <li>Celebrate diversity and inclusivity</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Don&apos;t</h4>
                        <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                            <li>Use jargon without explanation</li>
                            <li>Make assumptions about reader knowledge</li>
                            <li>Use clickbait headlines</li>
                            <li>Plagiarize or use AI-generated content without attribution</li>
                        </ul>
                    </div>
                </div>
            ),
        },
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'seo', label: 'SEO Checklist', icon: CheckCircle },
        { id: 'formatting', label: 'Formatting Rules', icon: FileText },
        { id: 'tone', label: 'Tone & Voice', icon: Eye },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editorial Style Guide</h1>
                <p className="text-gray-600 mt-1">Guidelines for consistent, high-quality content</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg mb-1 transition ${activeSection === item.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {sections[activeSection].title}
                        </h2>
                        {sections[activeSection].content}
                    </div>

                    {/* Quick Reference */}
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Quick Reference</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-700">Title Length</p>
                                <p className="text-gray-600">50-60 characters</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Description</p>
                                <p className="text-gray-600">150-160 characters</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Reading Time</p>
                                <p className="text-gray-600">5-7 minutes ideal</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">Images</p>
                                <p className="text-gray-600">1 per 300 words</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}