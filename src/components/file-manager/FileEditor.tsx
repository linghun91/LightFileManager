"use client";

import React, { useState, useEffect } from 'react';
import type { FileSystemNode } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, XCircle } from 'lucide-react';

interface FileEditorProps {
  file: FileSystemNode;
  onSave: (fileId: string, newContent: string) => void;
  onClose: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ file, onSave, onClose }) => {
  const [content, setContent] = useState(file.content || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(file.content || '');
    setHasChanges(false); // Reset changes when file prop changes
  }, [file]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onSave(file.id, content);
    setHasChanges(false);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      <header className="p-3 border-b flex items-center justify-between bg-muted/50 sticky top-0 z-10">
        <h3 className="text-lg font-semibold truncate" title={file.name}>{file.name}</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save size={16} className="mr-2" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
             <XCircle size={16} className="mr-2" /> Close
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1 p-1">
        <Textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full min-h-[calc(100vh-200px)] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-3 font-mono text-sm"
          placeholder="Enter file content..."
          aria-label={`Editing ${file.name}`}
        />
      </ScrollArea>
      <footer className="p-2 border-t text-xs text-muted-foreground bg-muted/50">
        {/* Could show line/col count, file size, etc. here */}
        {hasChanges ? "You have unsaved changes." : "No unsaved changes."}
        <span className="mx-2">|</span>
        Syntax Highlighting: (Basic Textarea)
      </footer>
    </div>
  );
};
