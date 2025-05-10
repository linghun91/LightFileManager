"use client";

import type { ChangeEvent } from 'react';
import React from 'react';
import type { FileSystemNode } from '@/types';
import { FileItem } from './FileItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, UploadCloud, ArrowLeft } from 'lucide-react';
import { findNodeByPath, getNode, ROOT_ID } from '@/lib/file-system-utils';

interface FileViewProps {
  nodes: FileSystemNode[];
  currentPath: string;
  onNavigate: (node: FileSystemNode) => void;
  onEditFile: (fileNode: FileSystemNode) => void;
  onCreateFolder: () => void;
  onUploadFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const FileView: React.FC<FileViewProps> = ({
  nodes,
  currentPath,
  onNavigate,
  onEditFile,
  onCreateFolder,
  onUploadFile,
  onDeleteNode,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parentPath = React.useMemo(() => {
    if (currentPath === '/') return null;
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length <= 1) return '/';
    return '/' + segments.slice(0, -1).join('/');
  }, [currentPath]);

  // This relies on the global fileSystem state, which is not ideal for this component.
  // For simplicity, it's kept this way, but ideally, parent node info or onNavigateUp would be passed.
  // For now, we look up the parent path and navigate to a dummy node representing it.
  const handleNavigateUp = () => {
    if (parentPath) {
       // Create a dummy node for navigation. This is a bit of a hack.
       // Ideally, onSelectPath from FileExplorer would be used or a specific onNavigateUp.
       const dummyParentNode: FileSystemNode = {
        id: 'parent_nav_id', // This ID won't exist in fileSystem, it's just for navigation.
        name: '..',
        type: 'directory',
        path: parentPath,
        parentId: null, // Not relevant for this dummy node
        lastModified: new Date().toISOString(),
      };
      onNavigate(dummyParentNode);
    }
  };

  const pathSegments = currentPath.split('/').filter(Boolean);
  const currentFolderName = pathSegments.length > 0 ? pathSegments[pathSegments.length -1] : "My Drive";


  return (
    <div className="flex flex-col h-full">
      <header className="p-2 border-b mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {currentPath !== '/' && parentPath !== null && (
               <Button variant="ghost" size="icon" onClick={handleNavigateUp} aria-label="Go up a directory">
                 <ArrowLeft size={18} />
               </Button>
            )}
            <h2 className="text-lg font-semibold truncate" title={currentPath === '/' ? 'My Drive' : currentPath}>
              {currentFolderName}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCreateFolder}>
              <FolderPlus size={16} className="mr-2" /> New Folder
            </Button>
            <Button variant="outline" size="sm" onClick={handleUploadClick}>
              <UploadCloud size={16} className="mr-2" /> Upload
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={onUploadFile}
            />
          </div>
        </div>
      </header>
      
      {nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>This folder is empty.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
            {nodes.map(node => (
              <FileItem
                key={node.id}
                node={node}
                onSelect={onNavigate}
                onEdit={onEditFile}
                onDelete={onDeleteNode}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
