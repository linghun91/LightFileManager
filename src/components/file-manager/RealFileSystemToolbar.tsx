"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useToast } from '@/hooks/use-toast';

interface RealFileSystemToolbarProps {
  onRefresh: () => void;
}

export const RealFileSystemToolbar: React.FC<RealFileSystemToolbarProps> = ({
  onRefresh,
}) => {
  const { toast } = useToast();

  const handleRefresh = () => {
    onRefresh();
    toast({
      title: "刷新成功",
      description: "文件列表已刷新"
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 mr-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          title="刷新文件列表"
        >
          <RefreshCw size={16} className="mr-2" /> 刷新
        </Button>
      </div>

      {/* 主题切换按钮 */}
      <ThemeToggle />
    </div>
  );
};
