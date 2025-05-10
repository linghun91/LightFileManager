import type { FileSystemNode } from '@/types';

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api/fs';

// 默认根路径
export const DEFAULT_ROOT_PATH = '/home/linghun/';

/**
 * 获取目录内容
 * @param path 目录路径
 * @returns Promise<FileSystemNode[]>
 */
export async function listDirectory(path: string = DEFAULT_ROOT_PATH): Promise<FileSystemNode[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/list?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取目录内容失败');
    }

    const data = await response.json();

    // 将API返回的数据转换为应用所需的FileSystemNode格式
    const nodes = data.map((item: any) => ({
      id: item.path, // 使用路径作为ID
      name: item.name,
      type: item.type,
      path: item.path,
      parentId: path, // 父目录路径
      lastModified: item.lastModified,
      size: item.size,
      // 如果是目录，添加空的childrenIds数组
      ...(item.type === 'directory' ? { childrenIds: [] } : {})
    }));

    // 对结果进行排序：先显示文件夹，再显示文件
    return nodes.sort((a, b) => {
      // 如果a是目录而b不是，a排在前面
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      // 如果b是目录而a不是，b排在前面
      if (b.type === 'directory' && a.type !== 'directory') return 1;
      // 如果两者类型相同，按名称字母顺序排序
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('获取目录内容失败:', error);
    throw error;
  }
}

/**
 * 读取文件内容
 * @param path 文件路径
 * @returns Promise<string>
 */
export async function readFile(path: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/read?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '读取文件失败');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
}

/**
 * 写入文件内容
 * @param path 文件路径
 * @param content 文件内容
 * @returns Promise<void>
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '写入文件失败');
    }
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
}

/**
 * 创建目录
 * @param path 目录路径
 * @returns Promise<void>
 */
export async function createDirectory(path: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/mkdir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建目录失败');
    }
  } catch (error) {
    console.error('创建目录失败:', error);
    throw error;
  }
}

/**
 * 删除文件或目录
 * @param path 文件或目录路径
 * @returns Promise<void>
 */
export async function deleteFileOrDirectory(path: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    throw error;
  }
}
