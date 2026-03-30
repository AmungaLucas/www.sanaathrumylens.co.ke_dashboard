'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Award, TrendingUp, FileText, Users, CheckCircle } from 'lucide-react';

export default function AuthorsPage() {
    const router = useRouter();
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('total_views');

    useEffect(() => {
        fetchAuthors();
    }, [sortBy]);

    const fetchAuthors = async () => {
        try {
            const res = await fetch(`/api/dashboard/editor/authors?sort=${sortBy}`);
            const data = await res.json();
            setAuthors(data);
        } catch (error) {
            console.error('Error fetching authors:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAuthors = authors.filter(author =>
        author.name.toLowerCase().includes(search.toLowerCase()) ||
        author.email?.toLowerCase().includes(search.toLowerCase())
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Author Management</h1>
                    <p className="text-gray-600 mt-1">Manage authors and their performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="total_views">Most Views</option>
                        <option value="total_posts">Most Posts</option>
                        <option value="follower_count">Most Followers</option>
                        <option value="name">Name A-Z</option>
                    </select>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Authors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAuthors.map((author) => (
                    <div key={author.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                        <div className="p-5">
                            <div className="flex items-start gap-4">
                                <img
                                    src={author.avatar_url || '/default-avatar.png'}
                                    alt={author.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{author.name}</h3>
                                        {author.is_verified && (
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{author.author_title}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                <div className="text-center">
                                    <FileText className="w-4 h-4 mx-auto text-gray-400" />
                                    <p className="text-lg font-semibold text-gray-900">{author.total_posts}</p>
                                    <p className="text-xs text-gray-500">Posts</p>
                                </div>
                                <div className="text-center">
                                    <TrendingUp className="w-4 h-4 mx-auto text-gray-400" />
                                    <p className="text-lg font-semibold text-gray-900">{author.total_views?.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Views</p>
                                </div>
                                <div className="text-center">
                                    <Award className="w-4 h-4 mx-auto text-gray-400" />
                                    <p className="text-lg font-semibold text-gray-900">{author.total_likes?.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Likes</p>
                                </div>
                                <div className="text-center">
                                    <Users className="w-4 h-4 mx-auto text-gray-400" />
                                    <p className="text-lg font-semibold text-gray-900">{author.follower_count}</p>
                                    <p className="text-xs text-gray-500">Followers</p>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => router.push(`/editor/assignments/new?author=${author.id}`)}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                    Assign Topic
                                </button>
                                <button
                                    onClick={() => router.push(`/editor/authors/${author.id}`)}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAuthors.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No authors found</p>
                </div>
            )}
        </div>
    );
}