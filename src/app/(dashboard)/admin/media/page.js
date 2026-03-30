'use client';

import { useEffect, useState } from 'react';
import { Upload, Search, Trash2, Copy, Check } from 'lucide-react';

export default function MediaLibraryPage() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        fetchMedia();
    }, [search]);

    const fetchMedia = async () => {
        try {
            const res = await fetch(`/api/dashboard/admin/media?search=${search}`);
            const data = await res.json();
            setMedia(data);
        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            const res = await fetch('/api/dashboard/admin/media', { method: 'POST', body: formData });
            if (res.ok) {
                fetchMedia();
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this file?')) return;
        try {
            const res = await fetch(`/api/dashboard/admin/media/${id}`, { method: 'DELETE' });
            if (res.ok) fetchMedia();
            else alert('Delete failed');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Delete failed');
        }
    };

    const copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        setCopied(url);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold">Media Library</h1><p className="text-gray-600">Manage uploaded images and files</p></div>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    <Upload className="w-4 h-4" /> Upload
                    <input type="file" onChange={handleUpload} className="hidden" accept="image/*,video/*,application/pdf" />
                </label>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
            </div>

            {uploading && <div className="text-center py-4">Uploading...</div>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group">
                        {item.type.startsWith('image/') ? (
                            <img src={item.url} alt={item.alt_text} className="w-full h-32 object-cover" />
                        ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">{item.type.split('/')[1].toUpperCase()}</div>
                        )}
                        <div className="p-2">
                            <p className="text-xs truncate">{item.original_name}</p>
                            <div className="flex justify-between mt-2">
                                <button onClick={() => copyUrl(item.url)} className="p-1 text-gray-500 hover:text-blue-600">{copied === item.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {media.length === 0 && <div className="text-center py-12 text-gray-500">No media files found</div>}
        </div>
    );
}