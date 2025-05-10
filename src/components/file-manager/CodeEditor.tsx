"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getLanguageFromFileName, highlightCode } from '@/lib/syntax-highlight';

interface CodeEditorProps {
  fileName: string;
  content: string;
  onChange: (newContent: string) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  content,
  onChange,
  readOnly = false,
}) => {
  const [value, setValue] = useState(content);
  const [language, setLanguage] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);

  // 检测语言
  useEffect(() => {
    const detectedLanguage = getLanguageFromFileName(fileName);
    setLanguage(detectedLanguage);
  }, [fileName]);

  // 同步滚动
  useEffect(() => {
    const handleScroll = () => {
      if (editorRef.current && previewRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = editorRef.current;
        const percentage = scrollTop / (scrollHeight - clientHeight);

        const previewScrollHeight = previewRef.current.scrollHeight;
        const previewClientHeight = previewRef.current.clientHeight;
        const previewScrollTop = percentage * (previewScrollHeight - previewClientHeight);

        previewRef.current.scrollTop = previewScrollTop;
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('scroll', handleScroll);
      return () => {
        editor.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // 处理内容变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // 添加调试信息
    console.log('编辑器内容变化:', {
      fileName,
      oldLength: value.length,
      newLength: newValue.length,
      changed: value !== newValue
    });

    // 确保触发 onChange 回调
    onChange(newValue);
  };

  // 处理Tab键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();

      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // 插入两个空格作为缩进
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setValue(newValue);
      onChange(newValue);

      // 设置光标位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // 高亮的HTML
  const highlightedCode = language
    ? highlightCode(value, language)
    : value;

  return (
    <div className="code-editor-container relative w-full h-full min-h-[calc(100vh-200px)] font-mono text-sm">
      {/* 编辑区域 */}
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={readOnly}
        className={`
          absolute top-0 left-0 w-full h-full resize-none p-3
          bg-transparent text-transparent caret-black dark:caret-white
          outline-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0
          ${readOnly ? 'cursor-default' : 'cursor-text'}
        `}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        data-gramm="false"
      />

      {/* 预览区域（语法高亮） */}
      <pre
        ref={previewRef}
        className="absolute top-0 left-0 w-full h-full overflow-hidden p-3 m-0 pointer-events-none"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      {/* 显示语言类型 */}
      {language && (
        <div className="absolute top-2 right-2 bg-muted/70 text-xs px-2 py-1 rounded-md opacity-70">
          {language}
        </div>
      )}
    </div>
  );
};
