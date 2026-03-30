'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    X, Save, Clock, User, AlertCircle
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable post item component
const SortablePost = ({ post, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: post.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-blue-50 text-blue-700 rounded p-1 text-xs cursor-move hover:bg-blue-100 transition"
        >
            <div className="flex items-center justify-between">
                <span className="truncate">{post.title}</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                        className="hover:text-blue-900"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(post); }}
                        className="hover:text-red-700"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function EditorialCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        status: 'SCHEDULED',
        scheduled_date: '',
        author_id: '',
        notes: '',
    });
    const [authors, setAuthors] = useState([]);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchCalendarData();
        fetchAuthors();
    }, [currentDate]);

    const fetchCalendarData = async () => {
        setLoading(true);
        setError(null);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        try {
            const res = await fetch(`/api/dashboard/editor/calendar?year=${year}&month=${month}`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            // Ensure data is an array
            const postsArray = Array.isArray(data) ? data : [];
            // Transform into object keyed by date string
            const postsByDate = {};
            postsArray.forEach(post => {
                const dateStr = post.scheduled_date;
                if (!postsByDate[dateStr]) postsByDate[dateStr] = [];
                postsByDate[dateStr].push(post);
            });
            setCalendarData(postsByDate);
        } catch (error) {
            console.error('Error fetching calendar:', error);
            setError(error.message);
            setCalendarData({});
        } finally {
            setLoading(false);
        }
    };

    const fetchAuthors = async () => {
        try {
            const res = await fetch('/api/dashboard/editor/authors');

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            // Ensure data is an array
            setAuthors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching authors:', error);
            setAuthors([]);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const postId = active.id;
        const newDate = over.id;
        if (!newDate) return;

        // Find old date
        let oldDate = null;
        for (const [date, posts] of Object.entries(calendarData)) {
            if (posts.some(p => p.id === postId)) {
                oldDate = date;
                break;
            }
        }
        if (!oldDate) return;

        // Update locally
        const updatedOld = calendarData[oldDate].filter(p => p.id !== postId);
        const post = calendarData[oldDate].find(p => p.id === postId);
        const updatedNew = [...(calendarData[newDate] || []), { ...post, scheduled_date: newDate }];

        setCalendarData({
            ...calendarData,
            [oldDate]: updatedOld,
            [newDate]: updatedNew,
        });

        // API call
        try {
            await fetch(`/api/dashboard/editor/calendar/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_date: newDate }),
            });
        } catch (error) {
            console.error('Failed to update schedule:', error);
            fetchCalendarData(); // Revert on error
        }
    };

    const handleAddPost = (date) => {
        setSelectedDate(date);
        setEditingPost(null);
        setFormData({
            title: '',
            status: 'SCHEDULED',
            scheduled_date: date,
            author_id: '',
            notes: '',
        });
        setShowModal(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            status: post.status,
            scheduled_date: post.scheduled_date,
            author_id: post.author_id || '',
            notes: post.notes || '',
        });
        setShowModal(true);
    };

    const handleDeletePost = async (post) => {
        if (!confirm('Are you sure you want to delete this scheduled post?')) return;
        try {
            const res = await fetch(`/api/dashboard/editor/calendar/${post.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCalendarData();
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingPost
                ? `/api/dashboard/editor/calendar/${editingPost.id}`
                : '/api/dashboard/editor/calendar';
            const method = editingPost ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                fetchCalendarData();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const todayStr = new Date().toISOString().slice(0, 10);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Calendar</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchCalendarData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editorial Calendar</h1>
                    <p className="text-gray-600 mt-1">Plan and schedule content</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToday}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {dayNames.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-7">
                        {days.map((day, index) => {
                            const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                            const posts = dateStr ? calendarData[dateStr] || [] : [];
                            const isToday = dateStr === todayStr;
                            const isPast = dateStr && new Date(dateStr) < new Date(todayStr);

                            return (
                                <div
                                    key={index}
                                    className={`min-h-32 p-2 border-r border-b border-gray-100 ${!day ? 'bg-gray-50' : ''
                                        } ${isPast ? 'bg-gray-50' : ''}`}
                                    data-date={dateStr}
                                >
                                    {day && (
                                        <>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-sm font-medium ${isToday
                                                    ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                                    : 'text-gray-700'
                                                    }`}>
                                                    {day}
                                                </span>
                                                <button
                                                    onClick={() => handleAddPost(dateStr)}
                                                    className="text-gray-400 hover:text-blue-600 transition"
                                                    title="Add post"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <SortableContext
                                                    items={posts.map(p => p.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {posts.map(post => (
                                                        <SortablePost
                                                            key={post.id}
                                                            post={post}
                                                            onEdit={handleEditPost}
                                                            onDelete={handleDeletePost}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DndContext>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSavePost} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Author
                                </label>
                                <select
                                    value={formData.author_id}
                                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select author</option>
                                    {Array.isArray(authors) && authors.map(author => (
                                        <option key={author.id} value={author.id}>{author.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Scheduled Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.scheduled_date}
                                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="PLANNED">Planned</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="SCHEDULED">Scheduled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingPost ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}