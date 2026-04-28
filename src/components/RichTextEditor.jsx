import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';

const EDITOR_STYLES = `
  .tiptap-editor .ProseMirror {
    min-height: 160px;
    padding: 14px 16px;
    outline: none;
    color: #f0ebe0;
    font-size: 0.875rem;
    line-height: 1.7;
  }
  .tiptap-editor .ProseMirror h1 {
    font-size: 1.375rem;
    font-weight: 900;
    margin: 0.75rem 0 0.375rem;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  .tiptap-editor .ProseMirror h2 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0.625rem 0 0.25rem;
    letter-spacing: -0.01em;
  }
  .tiptap-editor .ProseMirror p { margin-bottom: 0.25rem; }
  .tiptap-editor .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.375rem;
    margin: 0.375rem 0;
  }
  .tiptap-editor .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.375rem;
    margin: 0.375rem 0;
  }
  .tiptap-editor .ProseMirror li { margin-bottom: 0.125rem; }
  .tiptap-editor .ProseMirror > p:first-child.is-empty::before {
    content: 'Opis procesu produkcyjnego...';
    color: #6b6152;
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

const Btn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className={`flex items-center justify-center w-8 h-7 rounded-lg text-xs font-black transition-colors ${
      active
        ? 'bg-[#c8860a] text-[#161410]'
        : 'text-[#f0ebe0] hover:bg-[#c8860a]/20'
    }`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-[#3a3226] mx-0.5 self-center" />;

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <>
      <style>{EDITOR_STYLES}</style>
      <div className="border-2 border-[var(--border)] rounded-2xl overflow-hidden focus-within:border-red-600 transition-colors">
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-[#1e1a14] border-b border-[#3a3226]">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Pogrubienie">
            <Bold size={13} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursywa">
            <Italic size={13} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Podkreślenie">
            <UnderlineIcon size={13} />
          </Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Nagłówek 1">
            H1
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Nagłówek 2">
            H2
          </Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista punktowana">
            <List size={13} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerowana">
            <ListOrdered size={13} />
          </Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Do lewej">
            <AlignLeft size={13} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Wyśrodkuj">
            <AlignCenter size={13} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Do prawej">
            <AlignRight size={13} />
          </Btn>
        </div>
        <div className="tiptap-editor bg-[var(--bg)]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
};

export default RichTextEditor;
