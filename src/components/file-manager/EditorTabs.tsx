"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { FileSystemNode } from '@/types';
import { cn } from '@/lib/utils';

interface EditorTabsProps {
  openFiles: FileSystemNode[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onCloseAllFiles: () => void;
  onCloseOtherFiles: (fileId: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  openFiles,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onCloseAllFiles,
  onCloseOtherFiles,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // 检查是否需要显示滚动按钮
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      // 初始检查
      checkScrollButtons();

      // 窗口大小变化时重新检查
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  // 当打开的文件列表变化时，重新检查滚动按钮
  useEffect(() => {
    checkScrollButtons();
  }, [openFiles]);

  // 滚动到左侧
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // 滚动到右侧
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 处理鼠标滚轮事件
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScrollButtons();
    }
  };

  // 如果没有打开的文件，不显示标签栏
  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center border-b bg-muted/30 relative">
      {/* 左滚动按钮 */}
      {showLeftScroll && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute left-0 z-10 bg-background/80 hover:bg-background"
          onClick={scrollLeft}
        >
          <ChevronLeft size={16} />
        </Button>
      )}

      {/* 标签容器 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        onWheel={handleWheel}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex">
          {openFiles.map((file) => (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "flex items-center h-9 px-3 border-r cursor-pointer group relative",
                    activeFileId === file.id
                      ? "bg-background text-foreground border-b-2 border-b-primary"
                      : "bg-muted/30 text-muted-foreground hover:bg-background/50"
                  )}
                  onClick={() => onSelectFile(file.id)}
                  onContextMenu={() => onSelectFile(file.id)} // 右键点击时也选中该标签
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>

                  {/* 关闭按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.id);
                    }}
                  >
                    <X size={12} />
                  </Button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onCloseFile(file.id)}>
                  关闭
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCloseOtherFiles(file.id)}>
                  关闭其他
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onCloseAllFiles}>
                  关闭所有
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>

      {/* 右滚动按钮 */}
      {showRightScroll && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute right-0 z-10 bg-background/80 hover:bg-background"
          onClick={scrollRight}
        >
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  );
};
