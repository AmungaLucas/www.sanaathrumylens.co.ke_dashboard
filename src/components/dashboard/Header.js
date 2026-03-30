/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';

export default function Header({ user }) {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg w-80">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent outline-none text-sm flex-1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-gray-100"
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <img
                            src={user.avatar_url || '/default-avatar.png'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}