'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Book, Copy, Check, FileDown, Upload, Plus, Trash2, Maximize2, ArrowUp, AlertTriangle } from 'lucide-react';
import { useParseWorker } from '@/hooks/useParseWorker';
import { useExtractWorker } from '@/hooks/useExtractWorker';
import { TreeNodeView } from '@/components/TreeNodeView';
import { ApiDocs } from '@/components/ApiDocs';
import { ReadingModeModal } from '@/components/ReadingModeModal';
import {
  updateDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getCurrentDocument,
  setCurrentDocument,
  StoredDocument,
} from '@/lib/storage';
import { TreeNode } from '@/lib/json';

type AppMode = 'editor' | 'api';
type OutputTab = 'formatted' | 'tree' | 'toon' | 'md';


const LARGE_FILE_LINE_LIMIT = 1000;

function truncateContent(content: string, lineLimit: number): { display: string; isTruncated: boolean; totalLines: number } {
  const lines = content.split('\n');
  const totalLines = lines.length;
  if (totalLines <= lineLimit) {
    return { display: content, isTruncated: false, totalLines };
  }
  return {
    display: lines.slice(0, lineLimit).join('\n'),
    isTruncated: true,
    totalLines,
  };
}



export default function MarkdownEditor() {
  const [mode, setMode] = useState<AppMode>('editor');
  const [markdown, setMarkdown] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [documentName, setDocumentName] = useState('Untitled');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [outputTab, setOutputTab] = useState<OutputTab>('md');
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0, items: 0, tokens: 0 });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [fullscreenHtml, setFullscreenHtml] = useState<string | null>(null);
  const runWorker = useParseWorker();
  const runExtract = useExtractWorker();

  const fullContentRef = useRef<string>('');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const checkScroll = useCallback(() => {
    const windowScrolled = window.scrollY > 300;
    const inputScrolled = (inputRef.current?.scrollTop || 0) > 300;
    const outputScrolled = (outputRef.current?.scrollTop || 0) > 300;
    setShowScrollTop(windowScrolled || inputScrolled || outputScrolled);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    inputRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    outputRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // JSON-specific state
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [toonOutput, setToonOutput] = useState<string>('');
  const [mdFromJson, setMdFromJson] = useState<string>('');
  const [mdFromJsonHtml, setMdFromJsonHtml] = useState<string>('');

  // Derived preview truncation state
  const previewTruncation = useMemo(() => truncateContent(markdown, LARGE_FILE_LINE_LIMIT), [markdown]);

  // Helper to set content (full content in state, truncation only for preview)
  const setContentWithTruncation = useCallback((content: string) => {
    fullContentRef.current = content;
    setMarkdown(content);
  }, []);

  // Auto-detect if content is valid JSON (offloaded to worker)
  const [isJsonContent, setIsJsonContent] = useState(false);

  useEffect(() => {
    const content = fullContentRef.current || markdown;
    const trimmed = content.trim();
    // Quick check on main thread — only call worker if it looks like JSON
    if (!trimmed || !(trimmed.startsWith('{') || trimmed.startsWith('['))) {
      setIsJsonContent(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await runExtract<boolean>('JSON_DETECT', content);
        setIsJsonContent(result);
      } catch {
        setIsJsonContent(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [markdown, runExtract]);

  // Load documents from storage
  useEffect(() => {
    const docs = getDocuments();
    setDocuments(docs);

    const currentId = getCurrentDocument();
    if (currentId) {
      const doc = getDocument(currentId);
      if (doc) {
        setCurrentDocId(currentId);
        setContentWithTruncation(doc.content);
        setDocumentName(doc.name);
        setIsNewDocument(false);
      }
    }
  }, []);

  // Update markdown preview (for non-JSON content on 'md' tab)
  useEffect(() => {
    if (!markdown.trim() || outputTab !== 'md' || isJsonContent) {
      if (outputTab === 'md' && !isJsonContent) setHtmlPreview('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Truncate for preview performance on large files
        const previewContent = previewTruncation.isTruncated ? previewTruncation.display : markdown;
        const result = await runWorker<string>('MD_PARSE', { content: previewContent, format: 'markdown' });
        setHtmlPreview(result);
      } catch (e) {
        console.error('Markdown parse error:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [markdown, outputTab, isJsonContent, runWorker]);

  // Extract TOC
  useEffect(() => {
    const htmlToParse = isJsonContent ? mdFromJsonHtml : htmlPreview;
    if (!htmlToParse || outputTab !== 'md') {
      setToc([]);
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlToParse, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const extractedToc: { id: string; text: string; level: number }[] = [];
    headings.forEach(heading => {
      if (heading.id) {
        extractedToc.push({
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName[1])
        });
      }
    });
    setToc(extractedToc);
  }, [htmlPreview, mdFromJsonHtml, isJsonContent, outputTab]);

  // Parse JSON when content is JSON
  useEffect(() => {
    if (!isJsonContent) {
      setParsedJson(null);
      setJsonError(null);
      setToonOutput('');
      setTreeData(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await runWorker<any>('JSON_PARSE', markdown);
        setParsedJson(result);
        setJsonError(null);
      } catch (e: any) {
        setJsonError(e.message);
        setParsedJson(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown, isJsonContent, runWorker]);

  // Build tree data when needed
  useEffect(() => {
    if (outputTab === 'tree' && parsedJson) {
      runWorker<TreeNode>('JSON_TREE', parsedJson).then(setTreeData);
    }
  }, [outputTab, parsedJson, runWorker]);

  // Update stats (always use full content)
  useEffect(() => {
    const content = fullContentRef.current || markdown;
    if (!content) {
      setStats({ chars: 0, words: 0, lines: 0, items: 0, tokens: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await runWorker<{chars: number, words: number, lines: number, items: number, tokens: number}>('COUNT_STATS', { content, isJson: isJsonContent });
        setStats(result);
      } catch (e) {
        console.error('Stats error:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown, isJsonContent, runWorker]);

  // Build TOON output when needed
  useEffect(() => {
    if (outputTab === 'toon' && parsedJson) {
      runWorker<string>('JSON_TO_TOON', markdown).then(setToonOutput).catch(() => setToonOutput(''));
    }
  }, [outputTab, parsedJson, markdown, runWorker]);

  // Build Markdown from JSON when needed
  useEffect(() => {
    if (outputTab === 'md' && parsedJson) {
      runWorker<string>('JSON_TO_MD', markdown)
        .then(async (md) => {
          setMdFromJson(md);
          const html = await runWorker<string>('MD_PARSE', { content: md, format: 'markdown' });
          setMdFromJsonHtml(html);
        })
        .catch(() => {
          setMdFromJson('');
          setMdFromJsonHtml('');
        });
    }
  }, [outputTab, parsedJson, markdown, runWorker]);

  // Auto-save on interval (save full content)
  useEffect(() => {
    const content = fullContentRef.current || markdown;
    if (!content || isNewDocument || !currentDocId) return;

    const timer = setTimeout(() => {
      updateDocument(currentDocId, documentName, content);
    }, 2000);

    return () => clearTimeout(timer);
  }, [markdown, documentName, currentDocId, isNewDocument]);


  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // JSON files: read as text and auto-format
    if (file.name.endsWith('.json') || file.type === 'application/json') {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target?.result as string;
        try {
          const formatted = await runWorker<string>('JSON_FORMAT', text);
          setContentWithTruncation(formatted);
          setJsonError(null);
        } catch {
          setContentWithTruncation(text);
        }
        setOutputTab('formatted');
        setDocumentName(file.name);
        setCurrentDocId(null);
        setIsNewDocument(true);
        setIsProcessing(false);
      };
      reader.readAsText(file);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // Other files: extract via worker (CSV, Excel, PDF, DOCX, etc.)
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const mimeType = file.type || 'text/plain';

        const result = await runExtract<string>('EXTRACT_FILE', {
          data: buffer,
          mimeType,
          fileName: file.name,
        }, [buffer]);
        setContentWithTruncation(result);
        setOutputTab('md');
        setDocumentName(file.name);
        setCurrentDocId(null);
        setIsNewDocument(true);
      } catch (err: any) {
        console.error('Extraction error:', err);
        alert(`Failed to extract document: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [runWorker, runExtract]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const types = e.clipboardData.types;

    let mimeType: string | null = null;
    let contentToExtract: string | null = null;
    let fileData: ArrayBuffer | null = null;

    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const file = e.clipboardData.files[0];
      const buffer = await file.arrayBuffer();
      fileData = buffer;
      mimeType = file.type || 'text/plain';
    } else if (types.includes('text/html')) {
      e.preventDefault();
      contentToExtract = e.clipboardData.getData('text/html');
      mimeType = 'text/html';
    } else {
      const text = e.clipboardData.getData('text');
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          JSON.parse(text);
          e.preventDefault();
          // Auto-format JSON and switch to formatted output
          setIsProcessing(true);
          try {
            const formatted = await runWorker<string>('JSON_FORMAT', text);
            setContentWithTruncation(formatted);
          } catch {
            setContentWithTruncation(text);
          }
          setOutputTab('formatted');
          setIsProcessing(false);
          return;
        } catch {}
      }
    }

    const insertText = (textToInsert: string) => {
      const fullPrev = fullContentRef.current || markdown;
      const newContent = fullPrev.substring(0, start) + textToInsert + fullPrev.substring(end);
      setContentWithTruncation(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        textarea.focus();
      }, 0);
    };

    if (fileData && mimeType) {
      setIsProcessing(true);
      try {
        const result = await runExtract<string>('EXTRACT_FILE', {
          data: fileData,
          mimeType,
        }, [fileData as ArrayBuffer]);
        insertText(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    } else if (contentToExtract && mimeType) {
      setIsProcessing(true);
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(contentToExtract);
        const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        const result = await runExtract<string>('EXTRACT_FILE', {
          data: buffer,
          mimeType,
        }, [buffer]);
        insertText(result);
      } catch (err) {
        console.error(err);
        insertText(contentToExtract);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [runWorker, runExtract]);


  const handleExportPDF = useCallback(async () => {
    const content = fullContentRef.current || markdown;
    if (!content.trim()) {
      alert('Cannot export empty document');
      return;
    }

    try {
      // Generate HTML on demand: for JSON content, convert to markdown first
      let html: string;
      if (isJsonContent) {
        const md = await runWorker<string>('JSON_TO_MD', content);
        html = await runWorker<string>('MD_PARSE', { content: md, format: 'markdown' });
      } else {
        html = await runWorker<string>('MD_PARSE', { content, format: 'markdown' });
      }

      const { exportPDF } = await import('@/lib/pdf');
      const filename = documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await exportPDF(filename, html, documentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF');
    }
  }, [markdown, isJsonContent, documentName, runWorker]);

  const handleCopyOutput = useCallback(async () => {
    const fullContent = fullContentRef.current || markdown;
    let text = '';
    if (outputTab === 'formatted' && parsedJson) {
      text = JSON.stringify(parsedJson, null, 2);
    } else if (outputTab === 'toon') {
      text = toonOutput;
    } else if (outputTab === 'md') {
      text = isJsonContent ? mdFromJson : fullContent;
    } else {
      text = fullContent;
    }

    if (!text.trim()) {
      alert('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy');
    }
  }, [markdown, outputTab, parsedJson, toonOutput, mdFromJson, isJsonContent]);

  const handleNewDocument = useCallback(() => {
    fullContentRef.current = '';
    setMarkdown('');
    setDocumentName(`Untitled-${Date.now()}`);
    setCurrentDocId(null);
    setIsNewDocument(true);
  }, []);

  const handleLoadDocument = useCallback((docId: string) => {
    const doc = getDocument(docId);
    if (doc) {
      setCurrentDocId(docId);
      setContentWithTruncation(doc.content);
      setDocumentName(doc.name);
      setIsNewDocument(false);
      setCurrentDocument(docId);
    }
  }, [setContentWithTruncation]);

  const handleDeleteDocument = useCallback((docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(docId);
      setDocuments(getDocuments());
      if (currentDocId === docId) {
        handleNewDocument();
      }
    }
  }, [currentDocId, handleNewDocument]);

  // Available output tabs based on content
  const availableTabs = useMemo((): { key: OutputTab; label: string }[] => {
    const tabs: { key: OutputTab; label: string }[] = [
      { key: 'md', label: 'Markdown' },
    ];
    if (isJsonContent) {
      tabs.push(
        { key: 'formatted', label: 'Formatted' },
        { key: 'tree', label: 'Tree' },
        { key: 'toon', label: 'TOON' },
      );
    }
    return tabs;
  }, [isJsonContent]);

  const renderOutput = () => {
    if (outputTab === 'md') {
      if (isJsonContent) {
        // JSON → Markdown conversion
        return mdFromJsonHtml ? (
          <article
            className="max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: mdFromJsonHtml }}
          />
        ) : (
          <div className="text-gray-400 text-sm">Converting...</div>
        );
      }
      // Regular markdown/text → rendered HTML
      return (
        <article
          className="max-w-none text-gray-900"
          dangerouslySetInnerHTML={{ __html: htmlPreview }}
        />
      );
    }

    if (!isJsonContent) {
      return <div className="text-gray-400 text-sm">Not valid JSON</div>;
    }

    if (jsonError) {
      return <div className="text-red-500 text-sm font-mono">{jsonError}</div>;
    }

    if (!parsedJson) {
      return <div className="text-gray-400 text-sm">Parsing...</div>;
    }

    if (outputTab === 'tree') {
      return (
        <div className="text-sm font-mono">
          {treeData ? <TreeNodeView node={treeData} /> : 'Building tree...'}
        </div>
      );
    }
    if (outputTab === 'toon') {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
          {toonOutput || 'Converting...'}
        </pre>
      );
    }
    // formatted
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
        {JSON.stringify(parsedJson, null, 2)}
      </pre>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 border-b-4 border-blue-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-white drop-shadow">MDView</h1>
              <span className="text-white/60 text-xs font-semibold hidden sm:inline">v0.1.0</span>
            </div>
            {mode === 'editor' && stats.chars > 0 && (
              <div className="hidden md:flex gap-3 text-xs text-white/90 font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                <span title="Characters">{stats.chars.toLocaleString()} c</span>
                <span className="opacity-30">|</span>
                <span title="Words">{stats.words.toLocaleString()} w</span>
                <span className="opacity-30">|</span>
                <span title="Tokens (GPT-3/4)">{stats.tokens.toLocaleString()} t</span>
                <span className="opacity-30">|</span>
                <span title="Lines">{stats.lines.toLocaleString()} l</span>
                {isJsonContent && (
                  <>
                    <span className="opacity-30">|</span>
                    <span title="JSON Items">{stats.items.toLocaleString()} i</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {(['editor', 'api'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`px-4 py-1.5 rounded-md font-bold text-sm transition ${
                  mode === tab
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'editor' ? 'Editor' : 'API'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full bg-gray-50 py-8">
        {mode === 'api' ? (
          <ApiDocs />
        ) : (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div
            className={`grid gap-6 ${
              showPreview
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Input */}
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col relative">
              {isProcessing && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 font-bold text-blue-600 animate-pulse">
                    Processing...
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-800 px-4 py-3 flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Input</h3>
                  {isJsonContent && (
                    <span className="px-2 py-0.5 bg-amber-400 text-amber-900 rounded text-xs font-bold">JSON</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                    title="Upload File"
                  >
                    <Upload size={20} />
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
                <textarea
                  ref={inputRef}
                  value={markdown}
                  onChange={(e) => {
                    const val = e.target.value;
                    fullContentRef.current = val;
                    setMarkdown(val);
                  }}
                  onPaste={handlePaste}
                  onScroll={checkScroll}
                  placeholder="Paste content here — Markdown, JSON, HTML, or upload a file..."
                  className="w-full h-96 xl:h-screen p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 placeholder-gray-400 border-0 focus:bg-white focus:ring-0 transition-colors flex-1"
                  spellCheck={!isJsonContent}
                />
              </div>
            </div>

            {/* Output */}
            {showPreview && (
              <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col">
                <div className={`bg-gradient-to-r ${outputTab !== 'md' ? 'from-teal-600 to-teal-700 border-b-2 border-teal-800' : 'from-green-600 to-green-700 border-b-2 border-green-800'} px-4 py-3 flex justify-between items-center gap-2`}>
                  <div className="flex gap-1">
                    {availableTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setOutputTab(tab.key)}
                        className={`px-3 py-1 rounded font-bold text-xs transition ${
                          outputTab === tab.key
                            ? 'bg-white text-gray-700 shadow'
                            : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {outputTab === 'md' && toc.length > 0 && (
                      <button
                        onClick={() => setShowToc(!showToc)}
                        className={`p-2 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                          showToc
                            ? 'text-white bg-white/20'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                        title={showToc ? 'Hide TOC' : 'Show TOC'}
                      >
                        <Book size={20} />
                      </button>
                    )}
                    <button
                      onClick={handleCopyOutput}
                      className={`p-2 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                        isCopied
                          ? 'text-green-300'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      title={isCopied ? 'Copied' : 'Copy Output'}
                    >
                      {isCopied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                      title="Export PDF"
                    >
                      <FileDown size={20} />
                    </button>
                    {outputTab === 'md' && (
                      <button
                        onClick={async () => {
                          setIsFullscreen(true);
                          // Lazy parse full content for reading mode
                          if (!isJsonContent) {
                            const content = fullContentRef.current || markdown;
                            try {
                              const html = await runWorker<string>('MD_PARSE', { content, format: 'markdown' });
                              setFullscreenHtml(html);
                            } catch {
                              setFullscreenHtml(htmlPreview);
                            }
                          }
                        }}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                        title="Reading Mode"
                      >
                        <Maximize2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
                {previewTruncation.isTruncated && outputTab === 'md' && !isJsonContent && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border-b border-amber-100 text-amber-700 text-xs">
                    <AlertTriangle size={12} className="flex-shrink-0" />
                    <span>Preview limited to {LARGE_FILE_LINE_LIMIT.toLocaleString()} / {previewTruncation.totalLines.toLocaleString()} lines</span>
                  </div>
                )}
                <div className="h-96 xl:h-screen overflow-hidden p-4 bg-white flex-1 flex gap-4 relative">
                  {outputTab === 'md' && showToc && toc.length > 0 && (
                    <div className="w-64 flex-shrink-0 border-r border-gray-200 pr-4 overflow-y-auto">
                      <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider sticky top-0 bg-white py-2">Table of Contents</h4>
                      <ul className="space-y-2">
                        {toc.map((item, idx) => (
                          <li key={`${item.id}-${idx}`} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                            <a
                              href={`#${item.id}`}
                              className="text-sm text-gray-600 hover:text-blue-600 block truncate transition-colors"
                              title={item.text}
                            >
                              {item.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div
                    ref={outputRef}
                    onScroll={checkScroll}
                    className="flex-1 overflow-y-auto pr-2"
                  >
                    {renderOutput()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        
        {/* Global Scroll to Top */}
        {showScrollTop && !isFullscreen && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-white border-2 border-gray-200 text-gray-600 rounded-full shadow-lg hover:bg-gray-50 hover:text-blue-600 transition-all transform hover:scale-110 active:scale-95 z-40"
            title="Scroll to Top"
          >
            <ArrowUp size={24} />
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center gap-4 text-gray-500 text-sm">
          <a
            href="https://github.com/quannadev/markdown-view"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition flex items-center gap-1 font-semibold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
          <span>Made with ❤️ by quannadev</span>
        </div>
      </footer>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <ReadingModeModal
          isJsonContent={isJsonContent}
          mdFromJsonHtml={mdFromJsonHtml}
          fullscreenHtml={fullscreenHtml}
          showScrollTop={showScrollTop}
          onClose={() => { setIsFullscreen(false); setFullscreenHtml(null); }}
          onScroll={(scrollTop) => setShowScrollTop(scrollTop > 300)}
        />
      )}
    </div>
  );
}
