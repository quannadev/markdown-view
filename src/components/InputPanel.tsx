import { RefObject, useState } from 'react';
import { Upload, Bold, Italic, Heading, Code, Link, List, Quote, Image, Sigma } from 'lucide-react';

const TOOLBAR_BUTTONS = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: Heading, label: 'Heading', prefix: '## ', suffix: '' },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
  { icon: Link, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: List, label: 'List', prefix: '- ', suffix: '' },
  { icon: Quote, label: 'Quote', prefix: '> ', suffix: '' },
  { icon: Image, label: 'Image', prefix: '![alt](', suffix: ')' },
  { icon: Sigma, label: 'LaTeX', prefix: '$', suffix: '$' },
];

interface InputPanelProps {
  markdown: string;
  setMarkdown: (val: string) => void;
  fullContentRef: RefObject<string>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
  isJsonContent: boolean;
  isProcessing: boolean;
  showPreview: boolean;
  splitRatio: number;
  stats: { chars: number; words: number; lines: number; items: number; tokens: number };
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  checkScroll: () => void;
}

export function InputPanel({
  markdown,
  setMarkdown,
  fullContentRef,
  inputRef,
  fileRef,
  isJsonContent,
  isProcessing,
  showPreview,
  splitRatio,
  stats,
  handleFileUpload,
  handlePaste,
  checkScroll,
}: InputPanelProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });

  const applyFormat = (prefix: string, suffix: string, label: string) => {
    const ta = inputRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || label.toLowerCase()) + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    fullContentRef.current = newText;
    setMarkdown(newText);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + prefix.length + (selected || label.toLowerCase()).length + suffix.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const applyFormatToSelection = (prefix: string, suffix: string) => {
    const ta = inputRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    if (!selected) return;
    const replacement = prefix + selected + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    fullContentRef.current = newText;
    setMarkdown(newText);
    setSelectionToolbar(s => ({ ...s, show: false }));
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + replacement.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col relative print:hidden"
      style={showPreview ? { flex: `0 0 ${splitRatio}%` } : { flex: '1 1 auto' }}
    >
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <div className="text-sm text-gray-500 animate-pulse">
            Processing...
          </div>
        </div>
      )}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Input</h3>
          {isJsonContent && (
            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">JSON</span>
          )}
          {stats.chars > 0 && (
            <div className="hidden md:flex gap-2 text-xs text-gray-500 font-mono border border-gray-200 rounded-md px-2.5 py-0.5">
              <span title="Characters">{stats.chars.toLocaleString()} c</span>
              <span className="text-gray-300">·</span>
              <span title="Words">{stats.words.toLocaleString()} w</span>
              <span className="text-gray-300">·</span>
              <span title="Tokens (GPT-3/4)">{stats.tokens.toLocaleString()} t</span>
              <span className="text-gray-300">·</span>
              <span title="Lines">{stats.lines.toLocaleString()} l</span>
              {isJsonContent && (
                <>
                  <span className="text-gray-300">·</span>
                  <span title="JSON Items">{stats.items.toLocaleString()} i</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
            title="Upload File"
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xls,.xlsx,.doc,.docx,.pdf,.txt,.md,.html,.htm,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
      <div className="relative flex-1 flex flex-col">
        {/* Markdown toolbar — visible on focus */}
        {isInputFocused && !isJsonContent && (
          <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 bg-white">
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                title={btn.label}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyFormat(btn.prefix, btn.suffix, btn.label);
                }}
              >
                <btn.icon size={14} />
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          value={markdown}
          onChange={(e) => {
            const val = e.target.value;
            fullContentRef.current = val;
            setMarkdown(val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const ta = e.currentTarget;
              const start = ta.selectionStart;
              const end = ta.selectionEnd;
              const text = ta.value;
              const indent = '  ';

              if (start === end) {
                if (!e.shiftKey) {
                  const newText = text.substring(0, start) + indent + text.substring(end);
                  fullContentRef.current = newText;
                  setMarkdown(newText);
                  setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + indent.length; }, 0);
                } else {
                  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                  if (text.substring(lineStart, lineStart + indent.length) === indent) {
                    const newText = text.substring(0, lineStart) + text.substring(lineStart + indent.length);
                    fullContentRef.current = newText;
                    setMarkdown(newText);
                    setTimeout(() => { ta.selectionStart = ta.selectionEnd = Math.max(lineStart, start - indent.length); }, 0);
                  }
                }
              } else {
                const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                const selectedText = text.substring(lineStart, end);
                const lines = selectedText.split('\n');
                const modified = lines.map(line =>
                  e.shiftKey
                    ? (line.startsWith(indent) ? line.substring(indent.length) : line)
                    : indent + line
                );
                const newText = text.substring(0, lineStart) + modified.join('\n') + text.substring(end);
                fullContentRef.current = newText;
                setMarkdown(newText);
                const diff = modified.join('\n').length - selectedText.length;
                setTimeout(() => {
                  ta.selectionStart = lineStart;
                  ta.selectionEnd = end + diff;
                }, 0);
              }
            }
          }}
          onPaste={handlePaste}
          onScroll={() => { checkScroll(); setSelectionToolbar(s => ({ ...s, show: false })); }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => { setIsInputFocused(false); setTimeout(() => setSelectionToolbar(s => ({ ...s, show: false })), 200); }}
          onMouseUp={() => {
            const ta = inputRef.current;
            if (!ta || ta.selectionStart === ta.selectionEnd) {
              setSelectionToolbar(s => ({ ...s, show: false }));
              return;
            }
            const parent = ta.parentElement;
            if (!parent) return;
            const taRect = ta.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const text = ta.value.substring(0, ta.selectionStart);
            const lines = text.split('\n');
            const lineHeight = 20;
            const lineY = (lines.length - 1) * lineHeight - ta.scrollTop;
            const toolbarWidth = 280;
            const rawX = 16 + (lines[lines.length - 1].length * 7.5);
            const x = Math.max(toolbarWidth / 2, Math.min(taRect.width - toolbarWidth / 2, rawX));
            const y = lineY + (taRect.top - parentRect.top) - 36;
            setSelectionToolbar({ x, y: Math.max(4, y), show: true });
          }}
          onKeyUp={() => {
            const ta = inputRef.current;
            if (!ta || ta.selectionStart === ta.selectionEnd) {
              setSelectionToolbar(s => ({ ...s, show: false }));
            }
          }}
          placeholder="Paste or drag & drop files here — Markdown, JSON, CSV, Excel, PDF, Word..."
          className="w-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 placeholder-gray-400 border-0 focus:bg-white focus:ring-0 transition-colors flex-1"
          style={{ minHeight: '200px' }}
          spellCheck={!isJsonContent}
        />
        {/* Floating selection toolbar */}
        {selectionToolbar.show && !isJsonContent && (
          <div
            className="absolute z-30 flex items-center gap-0.5 px-1 py-0.5 bg-gray-800 rounded-md shadow-lg"
            style={{ left: selectionToolbar.x, top: selectionToolbar.y, transform: 'translateX(-50%)' }}
          >
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                title={btn.label}
                className="p-1 text-gray-300 hover:text-white rounded transition"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyFormatToSelection(btn.prefix, btn.suffix);
                }}
              >
                <btn.icon size={13} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
