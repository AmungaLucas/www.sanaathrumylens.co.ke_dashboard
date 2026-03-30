'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Shield, UserCog, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'AUTHOR',
        status: 'ACTIVE',
        password: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/dashboard/admin/admins');
            const data = await res.json();
            setAdmins(data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingAdmin ? `/api/dashboard/admin/admins/${editingAdmin.id}` : '/api/dashboard/admin/admins';
            const method = editingAdmin ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                fetchAdmins();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (adminId) => {
        if (!confirm('Are you sure you want to delete this admin user?')) return;
        try {
            const res = await fetch(`/api/dashboard/admin/admins/${adminId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAdmins();
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete');
        }
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            status: admin.status,
            password: '',
        });
        setShowModal(true);
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
                    <p className="text-gray-600">Manage administrators, editors, moderators, authors</p>
                </div>
                <button onClick={() => { setEditingAdmin(null); setFormData({ name: '', email: '', role: 'AUTHOR', status: 'ACTIVE', password: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Add Admin
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Role</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                            <th className="text-center py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-6 flex items-center gap-2">
                                    {admin.avatar_url ? <img src={admin.avatar_url} className="w-6 h-6 rounded-full" /> : <Shield className="w-5 h-5 text-gray-400" />}
                                    <span className="font-medium">{admin.name}</span>
                                </td>
                                <td className="py-3 px-6">{admin.email}</td>
                                <td className="py-3 px-6">
                                    <span className={`px-2 py-1 text-xs rounded-full ${admin.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                                        admin.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                            admin.role === 'EDITOR' ? 'bg-blue-100 text-blue-800' :
                                                admin.role === 'MODERATOR' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                        }`}>{admin.role}</span>
                                </td>
                                <td className="py-3 px-6">
                                    <span className={`px-2 py-1 text-xs rounded-full ${admin.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {admin.status}
                                    </span>
                                </td>
                                <td className="text-center py-3 px-6">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleEdit(admin)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(admin.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-lg font-semibold mb-4">{editingAdmin ? 'Edit Admin' : 'Add Admin'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                            <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                            {!editingAdmin && (<div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>)}
                            <div><label className="block text-sm font-medium mb-1">Role</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="SUPER_ADMIN">Super Admin</option><option value="ADMIN">Admin</option><option value="EDITOR">Editor</option><option value="MODERATOR">Moderator</option><option value="AUTHOR">Author</option><option value="CONTRIBUTOR">Contributor</option></select></div>
                            <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select></div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : (editingAdmin ? 'Update' : 'Create')}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}