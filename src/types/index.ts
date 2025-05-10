export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string; // Full path, e.g., "/Documents/Report.txt"
  parentId: string | null; // ID of the parent node
  content?: string; // For text files
  childrenIds?: string[]; // For directories, store IDs of children
  lastModified: string; // ISO date string
  size?: number; // Size in bytes, primarily for files
}

// Helper type for the structure of the file system data store
export interface FileSystemData {
  [id: string]: FileSystemNode;
}
