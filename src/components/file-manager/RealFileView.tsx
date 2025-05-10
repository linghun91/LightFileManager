"use client";

import type { ChangeEvent } from 'react';
import React from 'react';
import type { FileSystemNode } from '@/types';
import { FileItem } from './FileItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, ArrowLeft } from 'lucide-react';
import { DEFAULT_ROOT_PATH } from '@/lib/fs-api';
import path from 'path-browserify';

interface RealFileViewProps {
  nodes: FileSystemNode[];
  currentPath: string;
  onNavigate: (node: FileSystemNode) => void;
  onEditFile: (fileNode: FileSystemNode) => void;
  onCreateFolder: () => void;
  onDeleteNode: (nodePath: string) => void;
}

export const RealFileView: React.FC<RealFileViewProps> = ({
  nodes,
  currentPath,
  onNavigate,
  onEditFile,
  onCreateFolder,
  onDeleteNode,
}) => {
  const parentPath = React.useMemo(() => {
    if (currentPath === DEFAULT_ROOT_PATH) return null;
    return path.dirname(currentPath);
  }, [currentPath]);

  const handleNavigateUp = () => {
    if (parentPath) {
      // Create a dummy node for navigation
      const dummyParentNode: FileSystemNode = {
        id: parentPath, // Use path as ID
        name: '..',
        type: 'directory',
        path: parentPath,
        parentId: null,
        lastModified: new Date().toISOString(),
      };
      onNavigate(dummyParentNode);
    }
  };

  const currentFolderName = React.useMemo(() => {
    if (currentPath === DEFAULT_ROOT_PATH) return "主目录";
    return path.basename(currentPath);
  }, [currentPath]);

  return (
    <div className="flex flex-col h-full">
      <header className="p-2 border-b mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {currentPath !== DEFAULT_ROOT_PATH && parentPath !== null && (
              <Button variant="ghost" size="icon" onClick={handleNavigateUp} aria-label="Go up a directory">
                <ArrowLeft size={18} />
              </Button>
            )}
            <h2 className="text-lg font-semibold truncate" title={currentPath}>
              {currentFolderName}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCreateFolder}>
              <FolderPlus size={16} className="mr-2" /> 新建文件夹
            </Button>
          </div>
        </div>
      </header>

      {nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>此文件夹为空</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
            {/* 对节点进行排序：先显示文件夹，再显示文件 */}
            {[...nodes]
              .sort((a, b) => {
                // 如果a是目录而b不是，a排在前面
                if (a.type === 'directory' && b.type !== 'directory') return -1;
                // 如果b是目录而a不是，b排在前面
                if (b.type === 'directory' && a.type !== 'directory') return 1;
                // 如果两者类型相同，按名称字母顺序排序
                return a.name.localeCompare(b.name);
              })
              .map(node => (
                <FileItem
                  key={node.id}
                  node={node}
                  onSelect={onNavigate}
                  onEdit={onEditFile}
                  onDelete={() => onDeleteNode(node.path)}
                />
              ))
            }
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
