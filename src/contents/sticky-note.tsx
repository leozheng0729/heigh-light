import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface StickyNoteType {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex?: number;
}

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
}

export const colors = [
  '#fde93c', // 黄色
  '#88f0ff', // 蓝色
  '#82ff83', // 绿色
  '#ffb2b2', // 粉红色
  '#99b6ff', // 紫色
  '#dadad9', // 灰色
];

const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: note.width,
      height: note.height,
    });
  }, [note.id, note.width, note.height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(note.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        onUpdate(note.id, {
          width: Math.max(200, resizeStart.width + deltaX),
          height: Math.max(150, resizeStart.height + deltaY),
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
        width: `${note.width}px`,
        height: `${note.height}px`,
        backgroundColor: note.color,
        zIndex: note.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="sticky-note-header">
        {/* Delete button */}
        <div className="highlite-post-it-header" >
          {
            colors.map((color) => (<span
              key={color}
              className="highlite-post-it-header-color"
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              title="更改颜色"
            ></span>))
          }
          <button
            title="删除便签"
            className="highlite-delete-btn"
            onClick={() => onDelete(note.id)}
          >×</button>
        </div>

        {/* Content */}
        <textarea
          ref={textareaRef}
          className="note-area"
          value={note.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="Write here..."
          style={{ cursor: 'text' }}
        />

        {/* Resize Handle */}
        <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
      </div>
    </div>
  );
};

export default StickyNote;

