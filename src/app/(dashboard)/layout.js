'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    MessageCircle,
    Clock,
    AlertCircle,
    Eye,
    Flag,
    Home,
    PlusCircle,
    BarChart3,
    CheckCircle,
    XCircle,
    UserCog,
    Shield,
    Tag,           // ← ADD THIS
    Hash,          // ← ADD THIS (for tags icon)
} from 'lucide-react';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) {
                    router.push('/login');
                } else {
                    setUser(data);
                }
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const role = pathname.split('/')[1] || user?.role?.toLowerCase();
    const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

    // Navigation items based on role
    const getNavItems = () => {
        const items = {
            author: [
                { name: 'Dashboard', href: '/author', icon: LayoutDashboard },
                { name: 'My Posts', href: '/author/posts', icon: FileText },
                { name: 'Create Post', href: '/author/posts/new', icon: PlusCircle },
                { name: 'Analytics', href: '/author/analytics', icon: BarChart3 },
            ],
            editor: [
                { name: 'Dashboard', href: '/editor', icon: LayoutDashboard },
                { name: 'Pending Reviews', href: '/editor/pending', icon: Clock },
                { name: 'All Content', href: '/editor/content', icon: FileText },
                { name: 'Analytics', href: '/editor/analytics', icon: BarChart3 },
            ],
            moderator: [
                { name: 'Dashboard', href: '/moderator', icon: LayoutDashboard },
                { name: 'Comments', href: '/moderator/comments', icon: MessageCircle },
                { name: 'Reports', href: '/moderator/reports', icon: Flag },
                { name: 'Flagged Users', href: '/moderator/users', icon: AlertCircle },
            ],
            admin: [
                { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { name: 'Users', href: '/admin/users', icon: Users },
                { name: 'Categories', href: '/admin/categories', icon: Tag },      // ← Tag icon
                { name: 'Tags', href: '/admin/tags', icon: Hash },                // ← Hash icon
                { name: 'Comments', href: '/admin/comments', icon: MessageCircle },
                { name: 'Content', href: '/admin/content', icon: FileText },
                { name: 'Settings', href: '/admin/settings', icon: Settings },
                { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
            ],
        };

        return items[role] || items.author;
    };

    const navItems = getNavItems();
    const roleTitle = role?.charAt(0).toUpperCase() + role?.slice(1);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                {/* Logo */}
                <div className="p-6 border-b">
                    {sidebarOpen ? (
                        <>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Sanaa CMS
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">{roleTitle} Portal</p>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-2xl">📸</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${active
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {sidebarOpen && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} mb-3`}>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} px-4 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
                    >
                        <LogOut className="h-5 w-5" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Top Bar */}
                <div className="bg-white border-b sticky top-0 z-20">
                    <div className="px-8 py-4 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome back, {user?.name?.split(' ')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}