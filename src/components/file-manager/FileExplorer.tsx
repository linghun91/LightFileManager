"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import type { FileSystemNode, FileSystemData } from '@/types';
import { DirectoryTree } from './DirectoryTree';
import { FileView } from './FileView';
import { FileEditor } from './FileEditor';
import { CreateFolderDialog } from './CreateFolderDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  createInitialFileSystemData, 
  getNode, 
  getChildren, 
  getNodesInPath, 
  ROOT_ID,
  findNodeByPath
} from '@/lib/file-system-utils';
import { nanoid } from 'nanoid'; // For generating unique IDs

// nanoid is not in package.json. For simplicity, I will use Math.random based ID.
// A proper solution would be to add nanoid or uuid.
const generateId = () => Math.random().toString(36).substr(2, 9);


export default function FileExplorer() {
  const [fileSystem, setFileSystem] = useState<FileSystemData>(() => createInitialFileSystemData());
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [editingFile, setEditingFile] = useState<FileSystemNode | null>(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const { toast } = useToast();

  // Effect to ensure currentPath always corresponds to an existing directory
  useEffect(() => {
    const node = findNodeByPath(fileSystem, currentPath);
    if (!node || node.type !== 'directory') {
      setCurrentPath('/'); // Reset to root if current path is invalid
      setEditingFile(null); // Also clear any editing file
    }
  }, [currentPath, fileSystem]);

  const handleSelectPath = useCallback((path: string) => {
    const node = findNodeByPath(fileSystem, path);
    if (node && node.type === 'directory') {
      setCurrentPath(path);
      setEditingFile(null); // Clear editor when navigating
    } else if (node && node.type === 'file') {
      // If a file is selected from tree, perhaps open it? For now, just set path to parent.
      const parentNode = node.parentId ? getNode(fileSystem, node.parentId) : null;
      if(parentNode) {
        setCurrentPath(parentNode.path);
        handleEditFile(node);
      }
    }
  }, [fileSystem]);

  const handleNavigate = useCallback((node: FileSystemNode) => {
    if (node.type === 'directory') {
      setCurrentPath(node.path);
      setEditingFile(null);
    } else {
      handleEditFile(node);
    }
  }, [fileSystem]);

  const handleEditFile = (fileNode: FileSystemNode) => {
    if (fileNode.type === 'file') {
      setEditingFile(fileNode);
    }
  };

  const handleSaveFile = (fileId: string, newContent: string) => {
    setFileSystem(prevFs => {
      const updatedFs = { ...prevFs };
      const fileToUpdate = updatedFs[fileId];
      if (fileToUpdate && fileToUpdate.type === 'file') {
        updatedFs[fileId] = {
          ...fileToUpdate,
          content: newContent,
          lastModified: new Date().toISOString(),
          size: newContent.length, // Simplified size calculation
        };
        toast({ title: "File saved", description: `${fileToUpdate.name} has been updated.` });
        return updatedFs;
      }
      return prevFs;
    });
    setEditingFile(null);
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

    setFileSystem(prevFs => {
      const updatedFs = { ...prevFs };
      updatedFs[newFolderId] = newFolder;
      const updatedParent = {
        ...parentNode,
        childrenIds: [...(parentNode.childrenIds || []), newFolderId],
      };
      updatedFs[parentNode.id] = updatedParent;
      return updatedFs;
    });
    toast({ title: "Folder created", description: `Folder "${folderName}" has been created.` });
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

      setFileSystem(prevFs => {
        const updatedFs = { ...prevFs };
        updatedFs[newFileId] = newFileNode;
        const updatedParent = {
          ...parentNode,
          childrenIds: [...(parentNode.childrenIds || []), newFileId],
        };
        updatedFs[parentNode.id] = updatedParent;
        return updatedFs;
      });
      toast({ title: "File uploaded", description: `File "${file.name}" has been uploaded.` });
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
       setFileSystem(prevFs => {
        const updatedFs = { ...prevFs };
        updatedFs[newFileId] = newFileNode;
        const updatedParent = {
          ...parentNode,
          childrenIds: [...(parentNode.childrenIds || []), newFileId],
        };
        updatedFs[parentNode.id] = updatedParent;
        return updatedFs;
      });
      toast({ title: "File uploaded", description: `File "${file.name}" has been uploaded (content not stored for non-text).` });
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

    setFileSystem(prevFs => {
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
      toast({ title: "Deleted", description: `"${nodeToDelete.name}" has been deleted.` });
      // If the deleted node is part of the current path or is the editing file, adjust state
      if (currentPath.startsWith(nodeToDelete.path)) {
         setCurrentPath(nodeToDelete.parentId ? getNode(updatedFs, nodeToDelete.parentId)?.path || '/' : '/');
      }
      if (editingFile?.id === nodeId) {
        setEditingFile(null);
      }
      return updatedFs;
    });
  };
  
  const currentNodes = getNodesInPath(fileSystem, currentPath);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="w-full max-w-xs sm:w-1/3 md:w-1/4 lg:w-1/5 border-r bg-card p-1 sm:p-2 overflow-y-auto">
        <DirectoryTree 
          fileSystem={fileSystem} 
          currentPath={currentPath} 
          onSelectPath={handleSelectPath} 
        />
      </div>
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        {editingFile ? (
          <FileEditor
            key={editingFile.id} // Add key to force re-render if file changes
            file={editingFile}
            onSave={handleSaveFile}
            onClose={() => setEditingFile(null)}
          />
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
  );
}
