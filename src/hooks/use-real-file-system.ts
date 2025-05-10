"use client";

import { useState, useEffect, useCallback } from 'react';
import type { FileSystemNode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  listDirectory,
  readFile,
  writeFile,
  createDirectory,
  deleteFileOrDirectory,
  DEFAULT_ROOT_PATH
} from '@/lib/fs-api';

/**
 * 自定义Hook，用于与真实文件系统交互
 */
export function useRealFileSystem() {
  const [currentPath, setCurrentPath] = useState<string>(DEFAULT_ROOT_PATH);
  const [currentDirContents, setCurrentDirContents] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // 加载当前目录内容
  const loadCurrentDirectory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const contents = await listDirectory(currentPath);
      setCurrentDirContents(contents);
    } catch (err) {
      console.error('加载目录内容失败:', err);
      setError(err instanceof Error ? err : new Error('加载目录内容失败'));
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "无法加载目录内容"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, toast]);

  // 当路径变化时加载目录内容
  useEffect(() => {
    loadCurrentDirectory();
  }, [currentPath, loadCurrentDirectory]);

  // 读取文件内容
  const readFileContent = useCallback(async (filePath: string): Promise<string> => {
    try {
      // 尝试读取文件内容
      return await readFile(filePath);
    } catch (err) {
      console.error('读取文件内容失败:', err);
      toast({
        variant: "destructive",
        title: "读取失败",
        description: `无法读取文件内容: ${filePath}`
      });
      throw err;
    }
  }, [toast]);

  // 保存文件内容
  const saveFileContent = useCallback(async (filePath: string, content: string): Promise<void> => {
    try {
      await writeFile(filePath, content);
      toast({
        title: "保存成功",
        description: "文件已成功保存"
      });
    } catch (err) {
      console.error('保存文件内容失败:', err);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "无法保存文件内容"
      });
      throw err;
    }
  }, [toast]);

  // 创建新目录
  const createNewDirectory = useCallback(async (dirPath: string): Promise<void> => {
    try {
      await createDirectory(dirPath);
      await loadCurrentDirectory(); // 重新加载当前目录内容
      toast({
        title: "创建成功",
        description: "目录已成功创建"
      });
    } catch (err) {
      console.error('创建目录失败:', err);
      toast({
        variant: "destructive",
        title: "创建失败",
        description: "无法创建目录"
      });
      throw err;
    }
  }, [loadCurrentDirectory, toast]);

  // 删除文件或目录
  const deleteNode = useCallback(async (nodePath: string): Promise<void> => {
    try {
      await deleteFileOrDirectory(nodePath);
      await loadCurrentDirectory(); // 重新加载当前目录内容
      toast({
        title: "删除成功",
        description: "文件或目录已成功删除"
      });
    } catch (err) {
      console.error('删除失败:', err);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "无法删除文件或目录"
      });
      throw err;
    }
  }, [loadCurrentDirectory, toast]);

  return {
    currentPath,
    setCurrentPath,
    currentDirContents,
    isLoading,
    error,
    refreshDirectory: loadCurrentDirectory,
    readFileContent,
    saveFileContent,
    createNewDirectory,
    deleteNode
  };
}
