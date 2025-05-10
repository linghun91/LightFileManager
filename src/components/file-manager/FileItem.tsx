"use client";

import React from 'react';
import type { FileSystemNode } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Folder, FileText, FileEdit, Trash2, MoreVertical } from 'lucide-react';
import { formatBytes, isEditableFile } from '@/lib/file-system-utils';
import { formatDistanceToNow } from 'date-fns';

interface FileItemProps {
  node: FileSystemNode;
  onSelect: (node: FileSystemNode) => void;
  onEdit: (node: FileSystemNode) => void;
  onDelete: (nodeId: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ node, onSelect, onEdit, onDelete }) => {
  const canEdit = node.type === 'file' && isEditableFile(node.name);

  const handleSelect = () => {
    onSelect(node);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when clicking edit
    if (canEdit) {
      onEdit(node);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when clicking delete
    onDelete(node.id);
  };

  const lastModifiedRelative = formatDistanceToNow(new Date(node.lastModified), { addSuffix: true });

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
      onClick={handleSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
      tabIndex={0}
      aria-label={`Select ${node.name}`}
    >
      <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2 min-w-0">
         {node.type === 'directory' ? (
            <Folder className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-secondary-foreground" />
          )}
          <CardTitle className="text-base font-medium truncate" title={node.name}>
            {node.name}
          </CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options for {node.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex-grow">
        <p>Last modified: {lastModifiedRelative}</p>
        {node.type === 'file' && node.size !== undefined && (
          <p>Size: {formatBytes(node.size)}</p>
        )}
      </CardContent>
    </Card>
  );
};
