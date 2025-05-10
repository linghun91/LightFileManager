"use client";

import type { MouseEvent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import type { FileSystemNode } from '@/types';
import { Folder, FileText, ChevronRight, ChevronDown, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listDirectory, DEFAULT_ROOT_PATH } from '@/lib/fs-api';
import path from 'path-browserify';

interface FileTreeViewProps {
  currentPath: string;
  onSelectPath: (path: string) => void;
  onSelectFile?: (path: string) => void;
}

interface TreeNodeItemProps {
  path: string;
  name: string;
  isDirectory: boolean;
  currentPath: string;
  onSelectPath: (path: string) => void;
  onSelectFile?: (path: string) => void;
  level: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  path,
  name,
  isDirectory,
  currentPath,
  onSelectPath,
  onSelectFile,
  level
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isSelected = currentPath === path;

  const loadChildren = useCallback(async () => {
    if (!isDirectory) return;

    if (isLoaded && !isOpen) {
      setIsOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      const contents = await listDirectory(path);

      // 对内容进行排序：先显示文件夹，再显示文件
      const sortedContents = [...contents].sort((a, b) => {
        // 如果a是目录而b不是，a排在前面
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        // 如果b是目录而a不是，b排在前面
        if (b.type === 'directory' && a.type !== 'directory') return 1;
        // 如果两者类型相同，按名称字母顺序排序
        return a.name.localeCompare(b.name);
      });

      setChildren(sortedContents);
      setIsLoaded(true);
      setIsOpen(true);
    } catch (error) {
      console.error('加载子项失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [path, isLoaded, isOpen, isDirectory]);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isDirectory) return;

    if (isOpen) {
      setIsOpen(false);
    } else {
      loadChildren();
    }
  };

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();

    if (isDirectory) {
      onSelectPath(path);
      if (!isOpen) {
        loadChildren();
      }
    } else {
      // 如果是文件，并且提供了 onSelectFile 回调，则调用它
      if (onSelectFile) {
        onSelectFile(path);
      } else {
        // 如果没有提供 onSelectFile 回调，则使用 onSelectPath
        onSelectPath(path);
      }
    }
  };

  // 如果当前路径是该节点的子路径，自动展开
  useEffect(() => {
    if (isDirectory && currentPath.startsWith(path) && currentPath !== path && !isOpen) {
      loadChildren();
    }
  }, [currentPath, path, isOpen, loadChildren, isDirectory]);

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
        {isDirectory ? (
          <span onClick={handleToggle} className="mr-1 p-0.5 rounded hover:bg-muted">
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </span>
        ) : (
          <span className="w-6"></span> // 为文件预留空间，使其与目录对齐
        )}
        <span className="mr-1.5">
          {isDirectory ? (
            <Folder size={16} className={cn(isSelected ? "text-primary" : "text-muted-foreground")} />
          ) : (
            <FileText size={16} className="text-muted-foreground" />
          )}
        </span>
        <span className="truncate text-sm">{name}</span>
      </div>
      {isDirectory && isOpen && children.length > 0 && (
        <ul className="pl-0">
          {children.map(child => (
            <TreeNodeItem
              key={child.path}
              path={child.path}
              name={child.name}
              isDirectory={child.type === 'directory'}
              currentPath={currentPath}
              onSelectPath={onSelectPath}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({ currentPath, onSelectPath, onSelectFile }) => {
  const [rootItems, setRootItems] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRootItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const contents = await listDirectory(DEFAULT_ROOT_PATH);

      // 对内容进行排序：先显示文件夹，再显示文件
      const sortedContents = [...contents].sort((a, b) => {
        // 如果a是目录而b不是，a排在前面
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        // 如果b是目录而a不是，b排在前面
        if (b.type === 'directory' && a.type !== 'directory') return 1;
        // 如果两者类型相同，按名称字母顺序排序
        return a.name.localeCompare(b.name);
      });

      setRootItems(sortedContents);
    } catch (error) {
      console.error('加载根目录内容失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRootItems();
  }, [loadRootItems]);

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
          rootItems.map(item => (
            <TreeNodeItem
              key={item.path}
              path={item.path}
              name={item.name}
              isDirectory={item.type === 'directory'}
              currentPath={currentPath}
              onSelectPath={onSelectPath}
              onSelectFile={onSelectFile}
              level={0}
            />
          ))
        )}
      </ul>
    </nav>
  );
};
