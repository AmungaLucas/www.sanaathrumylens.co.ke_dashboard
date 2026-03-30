'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Users, CreditCard, BarChart3 } from 'lucide-react';

export default function MonetizationPage() {
    const [loading, setLoading] = useState(false);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Monetization Dashboard</h1>
                <p className="text-gray-600">Manage ads, subscriptions, and revenue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6"><DollarSign className="w-8 h-8 text-green-600 mb-2" /><p className="text-2xl font-bold">$0.00</p><p className="text-sm text-gray-500">Revenue (MTD)</p></div>
                <div className="bg-white rounded-xl shadow-sm border p-6"><TrendingUp className="w-8 h-8 text-blue-600 mb-2" /><p className="text-2xl font-bold">0</p><p className="text-sm text-gray-500">Ad Impressions</p></div>
                <div className="bg-white rounded-xl shadow-sm border p-6"><Users className="w-8 h-8 text-purple-600 mb-2" /><p className="text-2xl font-bold">0</p><p className="text-sm text-gray-500">Active Subscriptions</p></div>
                <div className="bg-white rounded-xl shadow-sm border p-6"><CreditCard className="w-8 h-8 text-yellow-600 mb-2" /><p className="text-2xl font-bold">0</p><p className="text-sm text-gray-500">Total Transactions</p></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">AdSense Integration</h2>
                <p className="text-gray-500">Configure your Google AdSense account and manage ad placements.</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Configure AdSense</button>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Subscription Plans</h2>
                <p className="text-gray-500">Create and manage subscription tiers for premium content.</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Manage Plans</button>
            </div>
        </div>
    );
}