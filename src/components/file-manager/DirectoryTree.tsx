"use client";

import type { MouseEvent } from 'react';
import React, { useState }
from 'react';
import type { FileSystemNode, FileSystemData } from '@/types';
import { getNode, getChildren, ROOT_ID, DEFAULT_ROOT_PATH } from '@/lib/file-system-utils';
import { Folder, FileText, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DirectoryTreeProps {
  fileSystem: FileSystemData;
  currentPath: string;
  onSelectPath: (path: string) => void;
}

interface DirectoryNodeItemProps {
  node: FileSystemNode;
  fileSystem: FileSystemData;
  currentPath: string;
  onSelectPath: (path: string) => void;
  level: number;
}

const DirectoryNodeItem: React.FC<DirectoryNodeItemProps> = ({ node, fileSystem, currentPath, onSelectPath, level }) => {
  const [isOpen, setIsOpen] = useState(true); // Default to open for simplicity, could be smarter

  if (!node) return null;

  const isSelected = currentPath === node.path;
  const isDirectory = node.type === 'directory';

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent selection when toggling
    if (isDirectory) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    onSelectPath(node.path);
    if (isDirectory && !isOpen) setIsOpen(true); // Open directory on selection if closed
  };

  const children = isDirectory ? getChildren(fileSystem, node.id) : [];

  return (
    <li className="my-0.5">
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center p-1.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground font-semibold"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.375}rem` }} // 0.375rem is base padding (p-1.5)
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(e as any); }}
      >
        {isDirectory && (
          <span onClick={handleToggle} className="mr-1 p-0.5 rounded hover:bg-muted">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        <span className="mr-1.5">
          {isDirectory ? <Folder size={16} className={cn(isSelected ? "text-primary" : "text-muted-foreground")} /> : <FileText size={16} className="text-muted-foreground" />}
        </span>
        <span className="truncate text-sm">{node.name}</span>
      </div>
      {isDirectory && isOpen && children.length > 0 && (
        <ul className="pl-0"> {/* Indentation handled by paddingLeft in div */}
          {children.map(childNode => (
            <DirectoryNodeItem
              key={childNode.id}
              node={childNode}
              fileSystem={fileSystem}
              currentPath={currentPath}
              onSelectPath={onSelectPath}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({ fileSystem, currentPath, onSelectPath }) => {
  const rootNode = getNode(fileSystem, ROOT_ID);

  if (!rootNode) {
    return <div className="p-4 text-destructive">Error: Root directory not found.</div>;
  }

  return (
    <nav aria-label="File system navigation">
      <ul className="space-y-1">
         <li>
          <Button
            variant={currentPath === DEFAULT_ROOT_PATH ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-sm h-auto p-1.5",
              currentPath === DEFAULT_ROOT_PATH && "font-semibold"
            )}
            onClick={() => onSelectPath(DEFAULT_ROOT_PATH)}
          >
            <Home size={16} className="mr-2 text-primary" />
            {rootNode.name}
          </Button>
        </li>
        {getChildren(fileSystem, ROOT_ID).map(node => (
          <DirectoryNodeItem
            key={node.id}
            node={node}
            fileSystem={fileSystem}
            currentPath={currentPath}
            onSelectPath={onSelectPath}
            level={0} // Start level 0 for children of root button
          />
        ))}
      </ul>
    </nav>
  );
};
