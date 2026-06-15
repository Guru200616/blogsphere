import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Quote, Link, Image, Table, Code, Eye } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Start writing your story...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isRawMode, setIsRawMode] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>(value);

  // Synchronize initial value to contentEditable on load, preventing infinite updates
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !isRawMode) {
      editorRef.current.innerHTML = value || '';
    }
    setRawText(value);
  }, [value, isRawMode]);

  const handleInput = () => {
    if (editorRef.current && !isRawMode) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    onChange(val);
  };

  const executeCommand = (command: string, value: string = '') => {
    if (isRawMode) return;
    document.execCommand(command, false, value);
    handleInput();
    // Re-focus the editor ref
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter the hyperlink destination URL:');
    if (url) executeCommand('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter the image endpoint URL (Unsplash or direct image link):');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const insertTable = () => {
    if (isRawMode) return;
    const rows = parseInt(prompt('Enter number of rows:', '3') || '0', 10);
    const cols = parseInt(prompt('Enter number of columns:', '3') || '0', 10);
    
    if (rows > 0 && cols > 0) {
      let tableHtml = '<table class="border-collapse border border-gray-300 my-4 w-full">';
      for (let r = 0; r < rows; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
          tableHtml += '<td class="border border-gray-300 p-2 text-sm bg-transparent">Cell</td>';
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</table><p>&nbsp;</p>';
      
      executeCommand('insertHTML', tableHtml);
    }
  };

  const toggleRawMode = () => {
    if (isRawMode) {
      // Transitioning back to rich editing
      setIsRawMode(false);
    } else {
      // Transitioning to raw editing
      if (editorRef.current) {
        setRawText(editorRef.current.innerHTML);
      }
      setIsRawMode(true);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-zinc-700/60 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900 flex flex-col transition-colors duration-200">
      {/* TOOLBAR */}
      <div className="bg-gray-50 dark:bg-zinc-800/60 p-2.5 border-b border-gray-200 dark:border-zinc-700/60 flex flex-wrap gap-1 items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('underline')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Paragraph"
          >
            <span className="font-sans text-xs font-semibold">PIL</span>
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<pre>')}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <button
            type="button"
            onClick={insertLink}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={insertImage}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Insert Image"
          >
            <Image className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={insertTable}
            disabled={isRawMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="Insert Table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>

        {/* CODE TOGGLER */}
        <button
          type="button"
          onClick={toggleRawMode}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isRawMode 
              ? 'bg-amber-100 text-amber-800 border-amber-200' 
              : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
          }`}
          title="Toggle Code/HTML Mode"
        >
          {isRawMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span>Show Visual</span>
            </>
          ) : (
            <>
              <Code className="w-4 h-4" />
              <span>Edit HTML</span>
            </>
          )}
        </button>
      </div>

      {/* EDITOR WORKSPACE */}
      <div className="p-4 bg-transparent outline-none flex-grow min-h-[350px]">
        {isRawMode ? (
          <textarea
            value={rawText}
            onChange={handleRawChange}
            placeholder={placeholder}
            className="w-full h-full min-h-[350px] font-mono text-sm border-0 p-0 focus:ring-0 resize-y focus:outline-none bg-transparent dark:text-zinc-100 placeholder-zinc-400"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="prose prose-sm dark:prose-invert max-w-none w-full h-full min-h-[350px] outline-none font-sans overflow-y-auto dark:text-zinc-200 focus:outline-none leading-relaxed placeholder-content"
            data-placeholder={placeholder}
            style={{
              maxHeight: '650px',
            }}
          />
        )}
      </div>

      <style>{`
        [contenteditable]:empty:before{
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
        .dark [contenteditable]:empty:before{
          color: #71717a;
        }
        /* Custom formatting styles inside contentEditable */
        .prose h1 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: inherit; line-height: 1.25; }
        .prose h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: inherit; line-height: 1.3; }
        .prose p { margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.625; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .prose blockquote { border-left-width: 4px; border-color: #e5e7eb; padding-left: 1rem; font-style: italic; color: #4b5563; margin: 1rem 0; }
        .dark .prose blockquote { border-color: #3f3f46; color: #a1a1aa; }
        .prose pre { background-color: #f3f4f6; color: #1f2937; padding: 0.75rem; border-radius: 0.375rem; font-family: monospace; overflow-x: auto; margin-bottom: 0.75rem; }
        .dark .prose pre { background-color: #18181b; color: #f4f4f5; }
        .prose table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .prose td { border: 1px solid #d1d5db; padding: 0.5rem; }
        .dark .prose td { border-color: #3f3f46; }
        .prose img { max-width: 100%; border-radius: 0.5rem; margin: 1rem auto; display: block; }
      `}</style>
    </div>
  );
};
export default RichTextEditor;
