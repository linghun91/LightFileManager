"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import type { FileSystemData } from '@/types';
import { deleteDatabase } from '@/lib/indexed-db';

interface FileSystemToolbarProps {
  fileSystem: FileSystemData;
  onImport: (data: FileSystemData) => void;
  onReset: () => void;
}

export const FileSystemToolbar: React.FC<FileSystemToolbarProps> = ({
  fileSystem,
  onImport,
  onReset,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出文件系统数据
  const handleExport = () => {
    try {
      // 创建一个包含文件系统数据的 Blob
      const dataStr = JSON.stringify(fileSystem, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `light-file-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "导出成功",
        description: "文件系统数据已导出为 JSON 文件。"
      });
    } catch (error) {
      console.error('导出文件系统数据失败:', error);
      toast({
        variant: "destructive",
        title: "导出失败",
        description: "导出文件系统数据时出错。"
      });
    }
  };

  // 触发文件选择对话框
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 处理导入文件
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as FileSystemData;

        // 验证导入的数据
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('无效的文件系统数据格式');
        }

        // 导入数据
        onImport(importedData);
        toast({
          title: "导入成功",
          description: "文件系统数据已成功导入。"
        });
      } catch (error) {
        console.error('导入文件系统数据失败:', error);
        toast({
          variant: "destructive",
          title: "导入失败",
          description: "导入的文件格式无效或损坏。"
        });
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
  };

  // 重置文件系统
  const handleReset = () => {
    if (window.confirm('确定要重置文件系统吗？这将删除所有文件和文件夹，并恢复到初始状态。')) {
      // 删除 IndexedDB 数据库
      deleteDatabase()
        .then(() => {
          // 重置文件系统状态
          onReset();
          toast({
            title: "重置成功",
            description: "文件系统已重置为初始状态。"
          });
        })
        .catch(error => {
          console.error('重置文件系统失败:', error);
          toast({
            variant: "destructive",
            title: "重置失败",
            description: "重置文件系统时出错。"
          });
        });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 mr-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          title="导出文件系统数据"
        >
          <Download size={16} className="mr-2" /> 导出
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          title="导入文件系统数据"
        >
          <Upload size={16} className="mr-2" /> 导入
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportFile}
          />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          title="重置文件系统"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <RefreshCw size={16} className="mr-2" /> 重置
        </Button>
      </div>

      {/* 主题切换按钮 */}
      <ThemeToggle />
    </div>
  );
};
