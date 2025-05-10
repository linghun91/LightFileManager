"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import type { FileSystemNode, FileSystemData } from '@/types';
import { DirectoryTree } from './DirectoryTree';
import { FileView } from './FileView';
import { FileEditor } from './FileEditor';
import { CreateFolderDialog } from './CreateFolderDialog';
import { FileSystemToolbar } from './FileSystemToolbar';
import { EditorTabs } from './EditorTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePersistentFileSystem } from '@/hooks/use-persistent-file-system';
import {
  getNode,
  getChildren,
  getNodesInPath,
  ROOT_ID,
  findNodeByPath,
  DEFAULT_ROOT_PATH
} from '@/lib/file-system-utils';
import { generateId } from '@/lib/utils';


export default function FileExplorer() {
  const { fileSystem, updateFileSystem, isLoading, error } = usePersistentFileSystem();
  const [currentPath, setCurrentPath] = useState<string>(DEFAULT_ROOT_PATH);
  const [openFiles, setOpenFiles] = useState<FileSystemNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  // 存储每个文件的编辑状态
  const [editingContents, setEditingContents] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // 获取当前活动文件
  const activeFile = activeFileId ? openFiles.find(file => file.id === activeFileId) || null : null;

  // Effect to ensure currentPath always corresponds to an existing directory
  useEffect(() => {
    const node = findNodeByPath(fileSystem, currentPath);
    if (!node || node.type !== 'directory') {
      setCurrentPath(DEFAULT_ROOT_PATH); // Reset to root if current path is invalid
    }
  }, [currentPath, fileSystem]);

  // 当文件系统更新时，更新打开的文件列表
  useEffect(() => {
    setOpenFiles(prevOpenFiles => {
      // 过滤掉已经不存在的文件
      const updatedOpenFiles = prevOpenFiles.filter(file =>
        fileSystem[file.id] && fileSystem[file.id].type === 'file'
      ).map(file => fileSystem[file.id]); // 使用最新的文件数据

      // 如果活动文件不在更新后的列表中，重置活动文件
      if (activeFileId && !updatedOpenFiles.some(file => file.id === activeFileId)) {
        setActiveFileId(updatedOpenFiles.length > 0 ? updatedOpenFiles[0].id : null);
      }

      return updatedOpenFiles;
    });
  }, [fileSystem, activeFileId]);

  const handleSelectPath = useCallback((path: string) => {
    const node = findNodeByPath(fileSystem, path);
    if (node && node.type === 'directory') {
      setCurrentPath(path);
    } else if (node && node.type === 'file') {
      // 如果选择的是文件，设置当前路径为父目录并打开文件
      const parentNode = node.parentId ? getNode(fileSystem, node.parentId) : null;
      if(parentNode) {
        setCurrentPath(parentNode.path);

        // 检查文件是否已经打开，如果已打开则只激活它
        const isFileOpen = openFiles.some(file => file.id === node.id);
        if (isFileOpen) {
          // 如果文件已经打开，只需激活它
          setActiveFileId(node.id);
        } else {
          // 如果文件未打开，调用 handleEditFile 打开它
          handleEditFile(node);
        }
      }
    }
  }, [fileSystem, openFiles]);

  const handleNavigate = useCallback((node: FileSystemNode) => {
    if (node.type === 'directory') {
      setCurrentPath(node.path);
    } else if (node.type === 'file') {
      // 检查文件是否已经打开，如果已打开则只激活它
      const isFileOpen = openFiles.some(file => file.id === node.id);
      if (isFileOpen) {
        // 如果文件已经打开，只需激活它
        setActiveFileId(node.id);
      } else {
        // 如果文件未打开，调用 handleEditFile 打开它
        handleEditFile(node);
      }
    }
  }, [fileSystem, openFiles]);

  // 打开文件进行编辑
  const handleEditFile = (fileNode: FileSystemNode) => {
    if (fileNode.type === 'file') {
      // 检查文件是否已经打开
      const isFileOpen = openFiles.some(file => file.id === fileNode.id);

      if (!isFileOpen) {
        // 如果文件未打开，添加到打开文件列表
        setOpenFiles(prev => [...prev, fileNode]);

        // 确保不使用之前可能存在的编辑状态
        // 检查是否存在该文件的编辑状态，如果存在则清除
        setEditingContents(prev => {
          if (prev[fileNode.id]) {
            const updated = { ...prev };
            delete updated[fileNode.id];
            return updated;
          }
          return prev;
        });
      } else {
        // 如果文件已经打开，确保使用最新的文件数据
        setOpenFiles(prev =>
          prev.map(file => file.id === fileNode.id ? fileNode : file)
        );
      }

      // 设置为活动文件
      setActiveFileId(fileNode.id);
    }
  };

  // 关闭文件
  const handleCloseFile = (fileId: string) => {
    // 从打开文件列表中移除
    setOpenFiles(prev => prev.filter(file => file.id !== fileId));

    // 从编辑内容状态中移除，确保完全清除该文件的编辑状态
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

  const handleSaveFile = (fileId: string, newContent: string) => {
    updateFileSystem(prevFs => {
      const updatedFs = { ...prevFs };
      const fileToUpdate = updatedFs[fileId];
      if (fileToUpdate && fileToUpdate.type === 'file') {
        updatedFs[fileId] = {
          ...fileToUpdate,
          content: newContent,
          lastModified: new Date().toISOString(),
          size: newContent.length, // Simplified size calculation
        };
        toast({ title: "文件已保存", description: `${fileToUpdate.name} 已更新。` });
        return updatedFs;
      }
      return prevFs;
    });

    // 更新编辑内容状态
    setEditingContents(prev => {
      const updated = { ...prev };
      updated[fileId] = newContent;
      return updated;
    });
  };

  const handleCreateFolder = (folderName: string) => {
    const parentNode = findNodeByPath(fileSystem, currentPath);
    if (!parentNode || parentNode.type !== 'directory') {
      toast({ variant: "destructive", title: "Error", description: "Cannot create folder in the current location." });
      return;
    }

    // Check for name conflicts
    const siblings = getChildren(fileSystem, parentNode.id);
    if (siblings.some(s => s.name === folderName && s.type === 'directory')) {
      toast({ variant: "destructive", title: "Error", description: `A folder named "${folderName}" already exists here.` });
      return;
    }

    const newFolderId = generateId();
    const newPath = parentNode.path === '/' ? `/${folderName}` : `${parentNode.path}/${folderName}`;

    const newFolder: FileSystemNode = {
      id: newFolderId,
      name: folderName,
      type: 'directory',
      path: newPath,
      parentId: parentNode.id,
      childrenIds: [],
      lastModified: new Date().toISOString(),
    };

    updateFileSystem(prevFs => {
      const updatedFs = { ...prevFs };
      updatedFs[newFolderId] = newFolder;
      const updatedParent = {
        ...parentNode,
        childrenIds: [...(parentNode.childrenIds || []), newFolderId],
      };
      updatedFs[parentNode.id] = updatedParent;
      return updatedFs;
    });
    toast({ title: "文件夹已创建", description: `文件夹 "${folderName}" 已创建。` });
  };

  const handleUploadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const parentNode = findNodeByPath(fileSystem, currentPath);
    if (!parentNode || parentNode.type !== 'directory') {
      toast({ variant: "destructive", title: "Error", description: "Cannot upload file to the current location." });
      return;
    }

    // Check for name conflicts
    const siblings = getChildren(fileSystem, parentNode.id);
    if (siblings.some(s => s.name === file.name && s.type === 'file')) {
      toast({ variant: "destructive", title: "Error", description: `A file named "${file.name}" already exists here.` });
      // Potentially ask to overwrite or rename
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newFileId = generateId();
      const newPath = parentNode.path === '/' ? `/${file.name}` : `${parentNode.path}/${file.name}`;

      const newFileNode: FileSystemNode = {
        id: newFileId,
        name: file.name,
        type: 'file',
        path: newPath,
        parentId: parentNode.id,
        content: content, // Storing content for text files, binary would be different
        lastModified: new Date(file.lastModified).toISOString(),
        size: file.size,
      };

      updateFileSystem(prevFs => {
        const updatedFs = { ...prevFs };
        updatedFs[newFileId] = newFileNode;
        const updatedParent = {
          ...parentNode,
          childrenIds: [...(parentNode.childrenIds || []), newFileId],
        };
        updatedFs[parentNode.id] = updatedParent;
        return updatedFs;
      });
      toast({ title: "文件已上传", description: `文件 "${file.name}" 已上传。` });
    };

    // For simplicity, assuming text files. For binary files, content storage/handling differs.
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      // Handle non-text files (e.g., store a reference or skip content)
       const newFileId = generateId();
       const newPath = parentNode.path === '/' ? `/${file.name}` : `${parentNode.path}/${file.name}`;
       const newFileNode: FileSystemNode = {
        id: newFileId,
        name: file.name,
        type: 'file',
        path: newPath,
        parentId: parentNode.id,
        lastModified: new Date(file.lastModified).toISOString(),
        size: file.size,
      };
       updateFileSystem(prevFs => {
        const updatedFs = { ...prevFs };
        updatedFs[newFileId] = newFileNode;
        const updatedParent = {
          ...parentNode,
          childrenIds: [...(parentNode.childrenIds || []), newFileId],
        };
        updatedFs[parentNode.id] = updatedParent;
        return updatedFs;
      });
      toast({ title: "文件已上传", description: `文件 "${file.name}" 已上传（非文本文件内容未存储）。` });
    }
    event.target.value = ''; // Reset file input
  };

  const handleDeleteNode = (nodeId: string) => {
    const nodeToDelete = getNode(fileSystem, nodeId);
    if (!nodeToDelete) return;

    // Recursive deletion logic for directories
    const CCE_recursiveDelete = (id: string, fs: FileSystemData): FileSystemData => {
      let newFs = { ...fs };
      const node = newFs[id];
      if (node && node.type === 'directory' && node.childrenIds) {
        node.childrenIds.forEach(childId => {
          newFs = CCE_recursiveDelete(childId, newFs);
        });
      }
      delete newFs[id];
      return newFs;
    };

    updateFileSystem(prevFs => {
      let updatedFs = CCE_recursiveDelete(nodeId, prevFs);

      // Remove from parent's childrenIds
      if (nodeToDelete.parentId) {
        const parent = updatedFs[nodeToDelete.parentId];
        if (parent && parent.childrenIds) {
          updatedFs[nodeToDelete.parentId] = {
            ...parent,
            childrenIds: parent.childrenIds.filter(id => id !== nodeId),
          };
        }
      }
      toast({ title: "已删除", description: `"${nodeToDelete.name}" 已被删除。` });
      // If the deleted node is part of the current path, adjust state
      if (currentPath.startsWith(nodeToDelete.path)) {
         setCurrentPath(nodeToDelete.parentId ? getNode(updatedFs, nodeToDelete.parentId)?.path || '/' : '/');
      }

      // 如果删除的是打开的文件，从打开文件列表中移除
      if (openFiles.some(file => file.id === nodeId)) {
        handleCloseFile(nodeId);
      }
      return updatedFs;
    });
  };

  const currentNodes = getNodesInPath(fileSystem, currentPath);

  // 显示加载状态
  if (isLoading) {
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
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        </div>
      </div>
    );
  }

  // 处理导入文件系统数据
  const handleImportFileSystem = (importedData: FileSystemData) => {
    updateFileSystem(importedData);
    setCurrentPath(DEFAULT_ROOT_PATH);
    setOpenFiles([]);
    setActiveFileId(null);
  };

  // 重置文件系统
  const handleResetFileSystem = () => {
    import('@/lib/file-system-utils').then(({ createInitialFileSystemData }) => {
      updateFileSystem(createInitialFileSystemData());
      setCurrentPath(DEFAULT_ROOT_PATH);
      setOpenFiles([]);
      setActiveFileId(null);
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b flex justify-end">
        <FileSystemToolbar
          fileSystem={fileSystem}
          onImport={handleImportFileSystem}
          onReset={handleResetFileSystem}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-xs sm:w-1/3 md:w-1/4 lg:w-1/5 border-r bg-card p-1 sm:p-2 overflow-y-auto">
          <DirectoryTree
            fileSystem={fileSystem}
            currentPath={currentPath}
            onSelectPath={handleSelectPath}
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
          <FileView
            nodes={currentNodes}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onEditFile={handleEditFile}
            onCreateFolder={() => setIsCreateFolderDialogOpen(true)}
            onUploadFile={handleUploadFile}
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
