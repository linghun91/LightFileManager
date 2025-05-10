import type { FileSystemNode, FileSystemData } from '@/types';

export const ROOT_ID = 'root';

export function createInitialFileSystemData(): FileSystemData {
  const now = new Date().toISOString();
  return {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: 'My Drive',
      type: 'directory',
      path: '/',
      parentId: null,
      childrenIds: ['docs', 'pics', 'readme'],
      lastModified: now,
    },
    docs: {
      id: 'docs',
      name: 'Documents',
      type: 'directory',
      path: '/Documents',
      parentId: ROOT_ID,
      childrenIds: ['report_txt', 'projects_folder'],
      lastModified: now,
    },
    report_txt: {
      id: 'report_txt',
      name: 'Report.txt',
      type: 'file',
      path: '/Documents/Report.txt',
      parentId: 'docs',
      content: 'This is a confidential report.',
      lastModified: now,
      size: 30,
    },
    projects_folder: {
      id: 'projects_folder',
      name: 'Projects',
      type: 'directory',
      path: '/Documents/Projects',
      parentId: 'docs',
      childrenIds: ['project_alpha_js'],
      lastModified: now,
    },
    project_alpha_js: {
      id: 'project_alpha_js',
      name: 'project_alpha.js',
      type: 'file',
      path: '/Documents/Projects/project_alpha.js',
      parentId: 'projects_folder',
      content: 'console.log("Hello from Project Alpha!");',
      lastModified: now,
      size: 42,
    },
    pics: {
      id: 'pics',
      name: 'Pictures',
      type: 'directory',
      path: '/Pictures',
      parentId: ROOT_ID,
      childrenIds: ['vacation_jpg'],
      lastModified: now,
    },
    vacation_jpg: {
      id: 'vacation_jpg',
      name: 'vacation.jpg',
      type: 'file',
      path: '/Pictures/vacation.jpg',
      parentId: 'pics',
      lastModified: now,
      size: 204800, // 200KB
    },
    readme: {
      id: 'readme',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      parentId: ROOT_ID,
      content: '# Light File Manager\n\nThis is a simple file manager.',
      lastModified: now,
      size: 55,
    },
  };
}

export function getNode(data: FileSystemData, id: string): FileSystemNode | undefined {
  return data[id];
}

export function getChildren(data: FileSystemData, parentId: string): FileSystemNode[] {
  const parent = getNode(data, parentId);
  if (!parent || parent.type !== 'directory' || !parent.childrenIds) {
    return [];
  }
  return parent.childrenIds.map(id => getNode(data, id)).filter(node => node !== undefined) as FileSystemNode[];
}

export function findNodeByPath(data: FileSystemData, path: string): FileSystemNode | undefined {
  if (path === '/') return getNode(data, ROOT_ID);
  
  // This is a simplified version. A real implementation would need to traverse.
  // For this mock, we can iterate through all nodes.
  for (const id in data) {
    if (data[id].path === path) {
      return data[id];
    }
  }
  return undefined;
}

export function getNodesInPath(data: FileSystemData, path: string): FileSystemNode[] {
  const targetNode = findNodeByPath(data, path);
  if (targetNode && targetNode.type === 'directory') {
    return getChildren(data, targetNode.id);
  }
  return [];
}

export function isEditableFile(fileName: string): boolean {
  const editableExtensions = ['.txt', '.md', '.js', '.json', '.css', '.html', '.xml', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rb', '.php'];
  return editableExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
