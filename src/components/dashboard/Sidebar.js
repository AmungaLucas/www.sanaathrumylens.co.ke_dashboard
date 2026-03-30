/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Calendar,
    Users,
    MessageSquare,
    Flag,
    Settings,
    Shield,
    Tag,
    Image,
    LogOut,
} from 'lucide-react';

const roleMenus = {
    AUTHOR: [
        { name: 'Dashboard', href: '/dashboard/author', icon: LayoutDashboard },
        { name: 'Posts', href: '/dashboard/author/posts', icon: FileText },
        { name: 'Analytics', href: '/dashboard/author/analytics', icon: BarChart3 },
        { name: 'Calendar', href: '/dashboard/author/calendar', icon: Calendar },
        { name: 'Collaborations', href: '/dashboard/author/collaborations', icon: Users },
    ],
    EDITOR: [
        { name: 'Dashboard', href: '/dashboard/editor', icon: LayoutDashboard },
        { name: 'Review Queue', href: '/dashboard/editor/queue', icon: FileText },
        { name: 'Calendar', href: '/dashboard/editor/calendar', icon: Calendar },
        { name: 'Assignments', href: '/dashboard/editor/assignments', icon: Users },
        { name: 'Authors', href: '/dashboard/editor/authors', icon: Users },
        { name: 'Style Guide', href: '/dashboard/editor/style-guide', icon: Shield },
    ],
    MODERATOR: [
        { name: 'Dashboard', href: '/dashboard/moderator', icon: LayoutDashboard },
        { name: 'Comments', href: '/dashboard/moderator/comments', icon: MessageSquare },
        { name: 'Reports', href: '/dashboard/moderator/reports', icon: Flag },
        { name: 'Users', href: '/dashboard/moderator/users', icon: Users },
        { name: 'Appeals', href: '/dashboard/moderator/appeals', icon: Shield },
    ],
    ADMIN: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Admins', href: '/admin/admins', icon: Shield },
        { name: 'Content', href: '/admin/content', icon: FileText },
        { name: 'Categories', href: '/admin/categories', icon: Tag },
        { name: 'Tags', href: '/admin/tags', icon: Hash },
        { name: 'Media', href: '/admin/media', icon: Image },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Monetization', href: '/admin/monetization', icon: DollarSign },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', href: '/admin/audit', icon: LogOut },
    ],
};

export default function Sidebar({ user }) {
    const pathname = usePathname();
    const role = user?.role || 'AUTHOR';
    const menus = roleMenus[role] || roleMenus.AUTHOR;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Sanaa Dashboard
                </h1>
                <p className="text-xs text-gray-500 mt-1 capitalize">{role.toLowerCase()} Portal</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menus.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={user.avatar_url || '/default-avatar.png'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full transition"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}