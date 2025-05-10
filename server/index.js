const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 默认根路径
const DEFAULT_ROOT_PATH = '/home/linghun/';

// 获取目录内容
app.get('/api/fs/list', async (req, res) => {
  try {
    const dirPath = req.query.path || DEFAULT_ROOT_PATH;
    
    // 确保路径存在且是目录
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: '指定的路径不是目录' });
    }
    
    // 读取目录内容
    const files = await fs.readdir(dirPath);
    
    // 获取每个文件/目录的详细信息
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            lastModified: stats.mtime,
          };
        } catch (error) {
          console.error(`获取文件信息失败: ${filePath}`, error);
          return null;
        }
      })
    );
    
    // 过滤掉无法获取信息的文件
    const validFiles = fileDetails.filter(file => file !== null);
    
    res.json(validFiles);
  } catch (error) {
    console.error('获取目录内容失败:', error);
    res.status(500).json({ error: '获取目录内容失败', details: error.message });
  }
});

// 读取文件内容
app.get('/api/fs/read', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: '未指定文件路径' });
    }
    
    // 确保路径存在且是文件
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: '指定的路径不是文件' });
    }
    
    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf8');
    
    res.json({ content });
  } catch (error) {
    console.error('读取文件失败:', error);
    res.status(500).json({ error: '读取文件失败', details: error.message });
  }
});

// 写入文件内容
app.post('/api/fs/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: '未指定文件路径' });
    }
    
    // 写入文件内容
    await fs.writeFile(filePath, content, 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('写入文件失败:', error);
    res.status(500).json({ error: '写入文件失败', details: error.message });
  }
});

// 创建目录
app.post('/api/fs/mkdir', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) {
      return res.status(400).json({ error: '未指定目录路径' });
    }
    
    // 创建目录
    await fs.mkdir(dirPath, { recursive: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('创建目录失败:', error);
    res.status(500).json({ error: '创建目录失败', details: error.message });
  }
});

// 删除文件或目录
app.delete('/api/fs/delete', async (req, res) => {
  try {
    const { path: targetPath } = req.body;
    if (!targetPath) {
      return res.status(400).json({ error: '未指定路径' });
    }
    
    // 检查路径是文件还是目录
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      // 删除目录
      await fs.rmdir(targetPath, { recursive: true });
    } else {
      // 删除文件
      await fs.unlink(targetPath);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败', details: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
