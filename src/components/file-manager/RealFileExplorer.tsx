"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { FileSystemNode } from '@/types';
import { FileTreeView } from './FileTreeView';
import { RealFileView } from './RealFileView';
import { FileEditor } from './FileEditor';
import { CreateFolderDialog } from './CreateFolderDialog';
import { RealFileSystemToolbar } from './RealFileSystemToolbar';
import { EditorTabs } from './EditorTabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRealFileSystem } from '@/hooks/use-real-file-system';
import { DEFAULT_ROOT_PATH } from '@/lib/fs-api';
import path from 'path-browserify';

export default function RealFileExplorer() {
  const {
    currentPath,
    setCurrentPath,
    currentDirContents,
    isLoading,
    error,
    refreshDirectory,
    readFileContent,
    saveFileContent,
    createNewDirectory,
    deleteNode
  } = useRealFileSystem();

  const [openFiles, setOpenFiles] = useState<FileSystemNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [editingContents, setEditingContents] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // 获取当前活动文件
  const activeFile = activeFileId ? openFiles.find(file => file.id === activeFileId) || null : null;

  // 打开文件进行编辑
  const handleEditFile = useCallback(async (fileNode: FileSystemNode) => {
    if (fileNode.type === 'file') {
      try {
        // 检查文件是否已经打开
        const isFileOpen = openFiles.some(file => file.id === fileNode.id);

        if (!isFileOpen) {
          // 读取文件内容
          const content = await readFileContent(fileNode.path);

          // 创建带有内容的文件节点
          const fileWithContent = {
            ...fileNode,
            content
          };

          // 添加到打开文件列表
          setOpenFiles(prev => [...prev, fileWithContent]);
        }

        // 设置为活动文件
        setActiveFileId(fileNode.id);
      } catch (error) {
        console.error('打开文件失败:', error);
        toast({
          variant: "destructive",
          title: "打开失败",
          description: `无法打开文件 "${fileNode.name}"`
        });
      }
    }
  }, [openFiles, readFileContent, setOpenFiles, setActiveFileId, toast]);

  // 处理路径选择
  const handleSelectPath = useCallback((path: string) => {
    setCurrentPath(path);
  }, [setCurrentPath]);

  // 处理导航
  const handleNavigate = useCallback((node: FileSystemNode) => {
    if (node.type === 'directory') {
      setCurrentPath(node.path);
    } else if (node.type === 'file') {
      handleEditFile(node);
    }
  }, [setCurrentPath, handleEditFile]);

  // 关闭文件
  const handleCloseFile = (fileId: string) => {
    // 从打开文件列表中移除
    setOpenFiles(prev => prev.filter(file => file.id !== fileId));

    // 从编辑内容状态中移除
    setEditingContents(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });

    // 如果关闭的是当前活动文件，选择新的活动文件
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter(file => file.id !== fileId);
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  // 关闭所有文件
  const handleCloseAllFiles = () => {
    setOpenFiles([]);
    setActiveFileId(null);
    setEditingContents({});
  };

  // 关闭其他文件
  const handleCloseOtherFiles = (fileId: string) => {
    const fileToKeep = openFiles.find(file => file.id === fileId);
    if (fileToKeep) {
      setOpenFiles([fileToKeep]);
      setActiveFileId(fileId);
    }
  };

  // 处理文件内容变化但未保存
  const handleContentChange = (fileId: string, newContent: string) => {
    setEditingContents(prev => ({
      ...prev,
      [fileId]: newContent
    }));
  };

  // 保存文件
  const handleSaveFile = async (fileId: string, newContent: string) => {
    try {
      const fileToSave = openFiles.find(file => file.id === fileId);
      if (fileToSave) {
        await saveFileContent(fileToSave.path, newContent);

        // 更新打开的文件内容
        setOpenFiles(prev =>
          prev.map(file =>
            file.id === fileId
              ? { ...file, content: newContent, lastModified: new Date().toISOString() }
              : file
          )
        );

        // 更新编辑内容状态
        setEditingContents(prev => {
          const updated = { ...prev };
          updated[fileId] = newContent;
          return updated;
        });
      }
    } catch (error) {
      console.error('保存文件失败:', error);
    }
  };

  // 创建文件夹
  const handleCreateFolder = async (folderName: string) => {
    try {
      const newFolderPath = path.join(currentPath, folderName);
      await createNewDirectory(newFolderPath);
      setIsCreateFolderDialogOpen(false);
    } catch (error) {
      console.error('创建文件夹失败:', error);
    }
  };

  // 删除节点
  const handleDeleteNode = async (nodePath: string) => {
    try {
      // 检查是否是打开的文件
      const isOpenFile = openFiles.some(file => file.path === nodePath);
      if (isOpenFile) {
        // 关闭文件
        const fileToClose = openFiles.find(file => file.path === nodePath);
        if (fileToClose) {
          handleCloseFile(fileToClose.id);
        }
      }

      await deleteNode(nodePath);
    } catch (error) {
      console.error('删除节点失败:', error);
    }
  };

  // 显示加载状态
  if (isLoading && currentDirContents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">加载文件系统数据...</p>
        </div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <div className="rounded-full h-12 w-12 border-2 border-destructive flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-lg mb-4">加载文件系统数据时出错</p>
          <p className="text-sm mb-4">{error.message}</p>
          <Button
            variant="destructive"
            onClick={() => refreshDirectory()}
          >
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b flex justify-end">
        <RealFileSystemToolbar
          onRefresh={refreshDirectory}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-xs sm:w-1/3 md:w-1/4 lg:w-1/5 border-r bg-card p-1 sm:p-2 overflow-y-auto">
          <FileTreeView
            currentPath={currentPath}
            onSelectPath={handleSelectPath}
            onSelectFile={async (filePath) => {
              try {
                // 创建一个临时文件节点
                const fileName = path.basename(filePath);
                const tempFileNode: FileSystemNode = {
                  id: filePath,
                  name: fileName,
                  type: 'file',
                  path: filePath,
                  parentId: path.dirname(filePath),
                  lastModified: new Date().toISOString(),
                };

                // 打开文件
                await handleEditFile(tempFileNode);
              } catch (error) {
                console.error('打开文件失败:', error);
                toast({
                  variant: "destructive",
                  title: "打开失败",
                  description: `无法打开文件: ${filePath}`
                });
              }
            }}
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {openFiles.length > 0 ? (
            <>
              {/* 编辑器标签栏 */}
              <EditorTabs
                openFiles={openFiles}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onCloseFile={handleCloseFile}
                onCloseAllFiles={handleCloseAllFiles}
                onCloseOtherFiles={handleCloseOtherFiles}
              />

              {/* 编辑器区域 */}
              <div className="flex-1 overflow-auto">
                {activeFile ? (
                  <FileEditor
                    key={activeFile.id}
                    file={{
                      ...activeFile,
                      // 如果有编辑中的内容，使用编辑中的内容，否则使用文件原始内容
                      content: editingContents[activeFile.id] !== undefined
                        ? editingContents[activeFile.id]
                        : activeFile.content
                    }}
                    onSave={handleSaveFile}
                    onClose={() => handleCloseFile(activeFile.id)}
                    onContentChange={(newContent) => handleContentChange(activeFile.id, newContent)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>没有打开的文件</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <RealFileView
              nodes={currentDirContents}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              onEditFile={handleEditFile}
              onCreateFolder={() => setIsCreateFolderDialogOpen(true)}
              onDeleteNode={handleDeleteNode}
            />
          )}
        </div>
        {isCreateFolderDialogOpen && (
          <CreateFolderDialog
            currentPath={currentPath}
            onClose={() => setIsCreateFolderDialogOpen(false)}
            onCreate={handleCreateFolder}
          />
        )}
      </div>
    </div>
  );
}
