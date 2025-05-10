import type { FileSystemData } from '@/types';

// 数据库配置
const DB_NAME = 'LightFileManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileSystem';

/**
 * 初始化 IndexedDB 数据库
 * @returns Promise<IDBDatabase>
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 打开数据库连接
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 数据库升级或创建时触发
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 如果存储对象不存在，则创建
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建存储对象，使用 'id' 作为键路径
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    // 数据库打开成功
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    // 数据库打开失败
    request.onerror = (event) => {
      console.error('IndexedDB 打开失败:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * 保存整个文件系统数据
 * @param fileSystem 文件系统数据
 * @returns Promise<void>
 */
export const saveFileSystem = async (fileSystem: FileSystemData): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 清空现有数据
    store.clear();

    // 将文件系统数据转换为数组并存储
    const entries = Object.entries(fileSystem).map(([id, node]) => ({
      id: 'fileSystem',
      data: fileSystem
    }));

    // 只存储一条记录，包含整个文件系统
    store.add(entries[0]);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = (event) => {
        console.error('保存文件系统数据失败:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('保存文件系统数据时出错:', error);
    throw error;
  }
};

/**
 * 加载文件系统数据
 * @returns Promise<FileSystemData | null>
 */
export const loadFileSystem = async (): Promise<FileSystemData | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // 获取文件系统数据
    const request = store.get('fileSystem');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        // 如果找到数据，返回文件系统对象，否则返回 null
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => {
        console.error('加载文件系统数据失败:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('加载文件系统数据时出错:', error);
    return null;
  }
};

/**
 * 删除数据库
 * @returns Promise<void>
 */
export const deleteDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};
