import React, { useState, useRef, useEffect } from 'react';

export interface TextBoxType {
  id: string;
  content: string;
  x: number;
  y: number;
  minWidth: number;
  height: number;
  color: string;
  zIndex?: number;
}

interface TextBoxProps {
  note: TextBoxType;
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void;
  onDelete: (id: string) => void;
}

export const textColors = [
  '#1976d2',
  '#f800ff',
  '#f44336',
  '#ff9800',
  '#e2cc07ff',
  '#4caf50',
];

const textColorsClass = {
  '#1976d2': 't-blue',
  '#f800ff': 't-purple',
  '#f44336': 't-red',
  '#ff9800': 't-orange',
  '#e2cc07ff': 't-yellow',
  '#4caf50': 't-green',
};

const TextBox: React.FC<TextBoxProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  if (!note?.id) return null;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle') || 
        (e.target as HTMLElement).closest('.note-area') ||
        (e.target as HTMLElement).closest('.delete-btn') ||
        (e.target as HTMLElement).closest('.color-picker')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - note.x,
      y: e.clientY - note.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(note.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, note.id, onUpdate]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.style.width = 'auto';
      console.log(textareaRef.current.scrollWidth, 'textareaRef.current.scrollWidth')
      textareaRef.current.style.width = `${textareaRef.current.scrollWidth}px`;
    }
    onUpdate(note.id, { content: e.target.value });
  };

  const handleColorChange = (color: string) => {
    onUpdate(note.id, { color });
  };

  return (
    <div
      ref={noteRef}
      className={`plasmo-sticky-note-item-${note.id}`}
      style={{
        position: 'absolute',
        padding: '10px',
        left: `${note.x}px`,
        top: `${note.y}px`,
        // width: `${note.width}px`,
        minWidth: `${note.minWidth}px`,
        height: 'auto',
        backgroundColor: 'transparent',
        zIndex: note.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="sticky-note-header">
        {/* Delete button */}
        <div className="highlite-post-it-header" style={{ justifyContent: 'flex-start'}}>
          <button
            title="删除文字区域"
            className="highlite-delete-btn"
            onClick={() => onDelete(note.id)}
          >×</button>
          {
            textColors.map((color) => (<span
              key={color}
              className="highlite-post-it-header-color"
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              title="更改颜色"
            ></span>))
          }
          <svg width="48" height="48" viewBox="0 0 1024 1024"><path fill="#515151" d="M159 194.9a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M223 162.9c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96M447.9 194.9a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M511.9 162.9c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-42.9-96-96-96M736.9 194.9a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M800.9 162.9c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.3-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96M159 511.4a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M223 479.4c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96M447.9 511.4a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M511.9 479.4c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-42.9-96-96-96M736.9 511.4a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M800.9 479.4c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.3-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96M159 831.9a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M223 799.9c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96M447.9 832a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M511.9 800c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-42.9-96-96-96M736.9 832.9a64 64 0 1 0 128 0 64 64 0 1 0-128 0"/><path fill="#515151" d="M800.9 800.9c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.3-32 32-32m0-64c-53 0-96 43-96 96s43 96 96 96 96-43 96-96c0-53.1-43-96-96-96"/></svg>
        </div>

        {/* Content */}
        <textarea
          ref={textareaRef}
          wrap="off"
          className={`note-area text-area ${textColorsClass[note.color]}`}
          value={note.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="Write here..."
          style={{ cursor: 'text', color: note.color }}
        />
      </div>
    </div>
  );
};

export default TextBox;