'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
    Bold,
    Italic,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Code,
    Quote,
    Undo,
    Redo,
    X,
} from 'lucide-react';

// Button component - declared outside render to avoid recreation on each render
const ToolbarButton = ({ onClick, isActive, icon: Icon, title, shortcut, disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`relative group p-2 rounded-lg transition-all duration-200 ${isActive
            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
    >
        <Icon className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            {title}
            {shortcut && <span className="ml-1 text-gray-400">{shortcut}</span>}
        </span>
    </button>
);

// Horizontal rule icon component
const HorizontalRuleIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
);

export default function TipTapEditor({ content, onChange, placeholder = 'Write your amazing content here...' }) {
    const [charCount, setCharCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 hover:underline cursor-pointer',
                },
            }),
            Image.configure({
                inline: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full my-4 shadow-md',
                },
            }),
        ],
        content: content || '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();
            const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            const chars = text.length;
            const readingMins = Math.max(1, Math.ceil(words / 200));

            setWordCount(words);
            setCharCount(chars);
            setReadingTime(readingMins);

            if (onChange) onChange(html);
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [editor, content]);

    const addImage = () => {
        const url = prompt('Enter image URL:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addLink = () => {
        if (editor && !editor.isActive('link')) {
            const selectedText = editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                ' '
            );
            setLinkText(selectedText);
            setLinkUrl('');
            setShowLinkModal(true);
        } else if (editor && editor.isActive('link')) {
            const attrs = editor.getAttributes('link');
            setLinkUrl(attrs.href || '');
            setShowLinkModal(true);
        }
    };

    const saveLink = () => {
        if (!linkUrl) return;

        if (editor && !editor.isActive('link')) {
            if (linkText && linkText !== linkUrl) {
                // Replace selected text with link
                editor.chain().focus().setLink({ href: linkUrl }).run();
            } else {
                editor.chain().focus().setLink({ href: linkUrl }).run();
            }
        } else if (editor && editor.isActive('link')) {
            editor.chain().focus().updateLink({ href: linkUrl }).run();
        }
        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
    };

    const removeLink = () => {
        if (editor) {
            editor.chain().focus().unsetLink().run();
        }
        setShowLinkModal(false);
    };

    const insertHorizontalRule = () => {
        if (editor) {
            editor.chain().focus().setHorizontalRule().run();
        }
    };

    if (!editor) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading editor...</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap gap-1 sticky top-0 z-10">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={Bold}
                        title="Bold"
                        shortcut="Ctrl+B"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={Italic}
                        title="Italic"
                        shortcut="Ctrl+I"
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={Heading2}
                        title="Heading 2"
                        shortcut="Ctrl+Alt+2"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        icon={Heading3}
                        title="Heading 3"
                        shortcut="Ctrl+Alt+3"
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={List}
                        title="Bullet List"
                        shortcut="Ctrl+Shift+8"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={ListOrdered}
                        title="Numbered List"
                        shortcut="Ctrl+Shift+7"
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <ToolbarButton
                        onClick={addLink}
                        isActive={editor.isActive('link')}
                        icon={LinkIcon}
                        title="Add Link"
                        shortcut="Ctrl+K"
                    />
                    <ToolbarButton
                        onClick={addImage}
                        isActive={false}
                        icon={ImageIcon}
                        title="Add Image"
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        isActive={editor.isActive('codeBlock')}
                        icon={Code}
                        title="Code Block"
                        shortcut="Ctrl+Alt+C"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={Quote}
                        title="Quote"
                        shortcut="Ctrl+Shift+B"
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <ToolbarButton
                        onClick={insertHorizontalRule}
                        isActive={false}
                        icon={HorizontalRuleIcon}
                        title="Horizontal Rule"
                        shortcut="---"
                    />

                    <div className="flex-1"></div>

                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        isActive={false}
                        icon={Undo}
                        title="Undo"
                        shortcut="Ctrl+Z"
                        disabled={!editor.can().undo()}
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        isActive={false}
                        icon={Redo}
                        title="Redo"
                        shortcut="Ctrl+Y"
                        disabled={!editor.can().redo()}
                    />
                </div>

                {/* Editor Content */}
                <EditorContent editor={editor} />

                {/* Status Bar */}
                <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            {wordCount} words
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {charCount} characters
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {readingTime} min read
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            className={`px-2 py-0.5 rounded ${editor.isActive('paragraph') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        >
                            Normal
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`px-2 py-0.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        >
                            H2
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`px-2 py-0.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        >
                            H3
                        </button>
                    </div>
                </div>
            </div>

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editor?.isActive('link') ? 'Edit Link' : 'Insert Link'}</h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {linkText && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Text to display"
                                />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="https://example.com"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            {editor?.isActive('link') && (
                                <button
                                    onClick={removeLink}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    Remove
                                </button>
                            )}
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveLink}
                                disabled={!linkUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}