"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { FileSystemNode } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, XCircle, Code } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { getLanguageFromFileName } from '@/lib/syntax-highlight';
import { isEditableFile } from '@/lib/file-system-utils';

interface FileEditorProps {
  file: FileSystemNode;
  onSave: (fileId: string, newContent: string) => void;
  onClose: () => void;
  onContentChange?: (newContent: string) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ file, onSave, onClose, onContentChange }) => {
  // 使用 useRef 来存储原始内容，避免重新渲染时的比较问题
  const originalContentRef = useRef(file.content || '');
  const [content, setContent] = useState(file.content || '');
  const [hasChanges, setHasChanges] = useState(false);

  // 当文件ID变化时，更新原始内容引用和当前内容
  useEffect(() => {
    originalContentRef.current = file.content || '';
    setContent(file.content || '');
    setHasChanges(false); // 重置更改状态
  }, [file.id]); // 只在文件ID变化时重置

  const handleContentChange = (newContent: string) => {
    // 直接比较新内容和原始内容
    const hasChanged = newContent !== originalContentRef.current;

    console.log('内容变化检测:', {
      fileName: file.name,
      originalLength: originalContentRef.current.length,
      newLength: newContent.length,
      hasChanged: hasChanged,
      sample: newContent.substring(0, 20)
    });

    // 更新状态
    setContent(newContent);
    setHasChanges(hasChanged);

    // 通知父组件内容已更改
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleSave = () => {
    onSave(file.id, content);

    // 保存后更新原始内容引用
    originalContentRef.current = content;
    setHasChanges(false);

    // 添加调试信息
    console.log('保存文件:', file.id, '内容长度:', content.length);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      <header className="p-3 border-b flex items-center justify-between bg-muted/50 sticky top-0 z-10">
        <h3 className="text-lg font-semibold truncate" title={file.name}>{file.name}</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            title={hasChanges ? "保存更改" : "没有更改需要保存"}
          >
            <Save size={16} className="mr-2" /> Save {hasChanges ? '(已修改)' : '(无更改)'}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
             <XCircle size={16} className="mr-2" /> Close
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1 p-1">
        <CodeEditor
          fileName={file.name}
          content={content}
          onChange={handleContentChange}
        />
      </ScrollArea>
      <footer className="p-2 border-t text-xs text-muted-foreground bg-muted/50 flex items-center justify-between">
        <div>
          {hasChanges ? "您有未保存的更改" : "没有未保存的更改"}
        </div>
        <div className="flex items-center">
          <Code size={14} className="mr-1" />
          语法高亮: {getLanguageFromFileName(file.name) || '纯文本'}
        </div>
      </footer>
    </div>
  );
};
