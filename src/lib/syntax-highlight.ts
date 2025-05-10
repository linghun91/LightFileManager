"use client";

import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 导入默认样式

// 根据文件扩展名获取语言类型
export function getLanguageFromFileName(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return null;
  
  // 扩展名到语言映射
  const extensionMap: Record<string, string> = {
    // 常见编程语言
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'xml': 'xml',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'ini': 'ini',
    'toml': 'toml',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'lua': 'lua',
    'r': 'r',
    'perl': 'perl',
    'pl': 'perl',
    'scala': 'scala',
    'groovy': 'groovy',
    'dockerfile': 'dockerfile',
    
    // 纯文本
    'txt': 'plaintext',
    'text': 'plaintext',
    'log': 'plaintext',
  };
  
  return extensionMap[extension] || null;
}

// 高亮代码
export function highlightCode(code: string, language: string | null): string {
  if (!language || language === 'plaintext') {
    return code;
  }
  
  try {
    // 尝试使用指定的语言进行高亮
    return hljs.highlight(code, { language }).value;
  } catch (error) {
    console.warn(`无法使用 ${language} 语言高亮代码:`, error);
    
    // 如果指定语言失败，尝试自动检测
    try {
      return hljs.highlightAuto(code).value;
    } catch (autoError) {
      console.error('自动高亮失败:', autoError);
      return code; // 返回原始代码
    }
  }
}

// 注册所有语言
export function registerAllLanguages(): void {
  // 这里可以按需导入语言，以减少包大小
  // 例如: import javascript from 'highlight.js/lib/languages/javascript';
  // 然后: hljs.registerLanguage('javascript', javascript);
  
  // 但为了简单起见，我们使用自动注册
  // highlight.js 会自动注册常见语言
}
