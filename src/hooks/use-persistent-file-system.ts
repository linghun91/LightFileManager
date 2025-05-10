"use client";

import { useState, useEffect, useCallback } from 'react';
import type { FileSystemData } from '@/types';
import { createInitialFileSystemData } from '@/lib/file-system-utils';
import { saveFileSystem, loadFileSystem } from '@/lib/indexed-db';
import { useToast } from '@/hooks/use-toast';

/**
 * 自定义 hook，用于管理持久化的文件系统数据
 * @returns 文件系统数据和更新函数
 */
export function usePersistentFileSystem() {
  // 文件系统数据状态
  const [fileSystem, setFileSystem] = useState<FileSystemData | null>(null);
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  // 错误状态
  const [error, setError] = useState<Error | null>(null);
  // Toast 通知
  const { toast } = useToast();

  // 初始化时从 IndexedDB 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // 从 IndexedDB 加载数据
        const data = await loadFileSystem();

        if (data) {
          // 如果有数据，使用加载的数据
          setFileSystem(data);
        } else {
          // 如果没有数据，使用初始数据
          setFileSystem(createInitialFileSystemData());
        }
      } catch (err) {
        console.error('加载文件系统数据失败:', err);
        setError(err instanceof Error ? err : new Error('加载文件系统数据失败'));
        // 出错时使用初始数据
        setFileSystem(createInitialFileSystemData());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 更新文件系统数据并保存到 IndexedDB
  const updateFileSystem = useCallback(async (
    updater: FileSystemData | ((prev: FileSystemData) => FileSystemData)
  ) => {
    try {
      // 更新状态
      setFileSystem(prev => {
        // 如果 updater 是函数，调用它获取新状态
        // 如果 updater 是对象，直接使用它作为新状态
        const newData = typeof updater === 'function'
          ? updater(prev || createInitialFileSystemData())
          : updater;

        // 异步保存到 IndexedDB
        saveFileSystem(newData).catch(err => {
          console.error('保存文件系统数据失败:', err);
          // 显示错误但不中断应用程序
          toast({
            variant: "destructive",
            title: "保存失败",
            description: "文件系统数据保存失败，但您可以继续使用应用程序。"
          });
        });

        return newData;
      });

      // 如果之前有错误，现在成功了，清除错误状态
      if (error) {
        setError(null);
      }
    } catch (err) {
      console.error('更新文件系统数据失败:', err);
      setError(err instanceof Error ? err : new Error('更新文件系统数据失败'));

      // 显示错误通知
      toast({
        variant: "destructive",
        title: "更新失败",
        description: "更新文件系统数据失败。"
      });
    }
  }, [error, toast]);

  return {
    fileSystem: fileSystem || createInitialFileSystemData(),
    updateFileSystem,
    isLoading,
    error,
  };
}
