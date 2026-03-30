'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/dashboard/admin/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert('Settings saved');
            } else {
                alert('Save failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-gray-600">Configure site behavior and feature flags</p></div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Site Configuration</h2>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium mb-1">Site Name</label><input type="text" value={settings.site_name || ''} onChange={e => handleChange('site_name', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
                        <div><label className="block text-sm font-medium mb-1">Site Description</label><textarea rows="3" value={settings.site_description || ''} onChange={e => handleChange('site_description', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
                        <div><label className="block text-sm font-medium mb-1">Posts Per Page</label><input type="number" value={settings.posts_per_page || 12} onChange={e => handleChange('posts_per_page', parseInt(e.target.value))} className="w-32 border rounded-lg px-3 py-2" /></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Feature Flags</h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.feature_ai_assistant || false} onChange={e => handleChange('feature_ai_assistant', e.target.checked)} /> Enable AI Content Assistant</label>
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.feature_advanced_analytics || false} onChange={e => handleChange('feature_advanced_analytics', e.target.checked)} /> Enable Advanced Analytics</label>
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.feature_collaboration || true} onChange={e => handleChange('feature_collaboration', e.target.checked)} /> Enable Collaboration Tools</label>
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.feature_monetization || false} onChange={e => handleChange('feature_monetization', e.target.checked)} /> Enable Monetization</label>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Maintenance Mode</h2>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={settings.maintenance_mode || false} onChange={e => handleChange('maintenance_mode', e.target.checked)} /> Enable Maintenance Mode</label>
                    {settings.maintenance_mode && <div><label className="block text-sm font-medium mb-1">Message</label><input type="text" value={settings.maintenance_message || ''} onChange={e => handleChange('maintenance_message', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>}
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Cache Management</h2>
                    <button onClick={async () => { await fetch('/api/dashboard/admin/cache/clear', { method: 'POST' }); alert('Cache cleared'); }} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"><RefreshCw className="w-4 h-4" /> Clear Cache</button>
                </div>
            </div>
        </div>
    );
}