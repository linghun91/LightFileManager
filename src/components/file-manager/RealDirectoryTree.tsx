"use client";

import type { MouseEvent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import type { FileSystemNode } from '@/types';
import { Folder, FileText, ChevronRight, ChevronDown, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listDirectory, DEFAULT_ROOT_PATH } from '@/lib/fs-api';
import path from 'path-browserify';

interface RealDirectoryTreeProps {
  currentPath: string;
  onSelectPath: (path: string) => void;
}

interface DirectoryNodeItemProps {
  path: string;
  name: string;
  currentPath: string;
  onSelectPath: (path: string) => void;
  level: number;
}

const DirectoryNodeItem: React.FC<DirectoryNodeItemProps> = ({ path, name, currentPath, onSelectPath, level }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isSelected = currentPath === path;

  const loadChildren = useCallback(async () => {
    if (isLoaded && !isOpen) {
      setIsOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      const contents = await listDirectory(path);
      // 只保留目录
      const directories = contents.filter(item => item.type === 'directory');
      setChildren(directories);
      setIsLoaded(true);
      setIsOpen(true);
    } catch (error) {
      console.error('加载子目录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [path, isLoaded, isOpen]);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      loadChildren();
    }
  };

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    onSelectPath(path);
    if (!isOpen) {
      loadChildren();
    }
  };

  // 如果当前路径是该节点的子路径，自动展开
  useEffect(() => {
    if (currentPath.startsWith(path) && currentPath !== path && !isOpen) {
      loadChildren();
    }
  }, [currentPath, path, isOpen, loadChildren]);

  return (
    <li className="my-0.5">
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center p-1.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground font-semibold"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.375}rem` }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(e as any); }}
      >
        <span onClick={handleToggle} className="mr-1 p-0.5 rounded hover:bg-muted">
          {isLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
        </span>
        <span className="mr-1.5">
          <Folder size={16} className={cn(isSelected ? "text-primary" : "text-muted-foreground")} />
        </span>
        <span className="truncate text-sm">{name}</span>
      </div>
      {isOpen && children.length > 0 && (
        <ul className="pl-0">
          {children.map(child => (
            <DirectoryNodeItem
              key={child.path}
              path={child.path}
              name={child.name}
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

export const RealDirectoryTree: React.FC<RealDirectoryTreeProps> = ({ currentPath, onSelectPath }) => {
  const [rootDirectories, setRootDirectories] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRootDirectories = useCallback(async () => {
    try {
      setIsLoading(true);
      const contents = await listDirectory(DEFAULT_ROOT_PATH);
      // 只保留目录
      const directories = contents.filter(item => item.type === 'directory');
      setRootDirectories(directories);
    } catch (error) {
      console.error('加载根目录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRootDirectories();
  }, [loadRootDirectories]);

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
            主目录
          </Button>
        </li>
        {isLoading ? (
          <li className="flex items-center justify-center p-4">
            <RefreshCw size={16} className="animate-spin mr-2" />
            <span>加载中...</span>
          </li>
        ) : (
          rootDirectories.map(dir => (
            <DirectoryNodeItem
              key={dir.path}
              path={dir.path}
              name={dir.name}
              currentPath={currentPath}
              onSelectPath={onSelectPath}
              level={0}
            />
          ))
        )}
      </ul>
    </nav>
  );
};
