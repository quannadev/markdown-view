'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Upload, ArrowUp } from 'lucide-react';
import { useParseWorker } from '@/hooks/useParseWorker';
import { useExtractWorker } from '@/hooks/useExtractWorker';

import { ReadingModeModal } from '@/components/ReadingModeModal';
import { EditorHeader } from '@/components/EditorHeader';
import { AppFooter } from '@/components/AppFooter';
import { InputPanel } from '@/components/InputPanel';
import { OutputPanel } from '@/components/OutputPanel';
import { SplitDragHandle } from '@/components/SplitDragHandle';
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

  const [markdown, setMarkdown] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [documentName, setDocumentName] = useState('Untitled');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const processFile = useCallback((file: File) => {
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
      return;
    }

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
  }, [runWorker, runExtract]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

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
      // Convert literal \n, \t escape sequences to actual newlines/tabs
      if (text.includes('\\n') || text.includes('\\t')) {
        e.preventDefault();
        const converted = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        const fullPrev = fullContentRef.current || markdown;
        const newContent = fullPrev.substring(0, start) + converted + fullPrev.substring(end);
        setContentWithTruncation(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + converted.length;
          textarea.focus();
        }, 0);
        return;
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

  const handleReadingMode = useCallback(async () => {
    setIsFullscreen(true);
    if (!isJsonContent) {
      const content = fullContentRef.current || markdown;
      try {
        const html = await runWorker<string>('MD_PARSE', { content, format: 'markdown' });
        setFullscreenHtml(html);
      } catch {
        setFullscreenHtml(htmlPreview);
      }
    }
  }, [isJsonContent, markdown, htmlPreview, runWorker]);

  const handlePrint = useCallback(async () => {
    let html = htmlPreview;
    if (!isJsonContent) {
      const content = fullContentRef.current || markdown;
      try {
        html = await runWorker<string>('MD_PARSE', { content, format: 'markdown' });
      } catch { /* use current preview */ }
    } else if (mdFromJsonHtml) {
      html = mdFromJsonHtml;
    }
    const styles = Array.from(document.styleSheets)
      .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>https://mdview.quanna.dev</title>
      <style>${styles}
      :root { --background: #ffffff; --foreground: #171717; }
      @media (prefers-color-scheme: dark) { :root { --background: #ffffff; --foreground: #171717; } }
      body { background: white !important; color: #1f2937 !important; margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
      article { max-width: 100%; color: #1f2937 !important; }
      article * { color: inherit; }
      article h1, article h2, article h3, article h4, article h5, article h6 { color: #111827 !important; }
      article code { color: #dc2626 !important; }
      article pre { color: #f9fafb !important; }
      article pre code { color: inherit !important; }
      article a { color: #3b82f6 !important; }
      </style>
    </head><body>
      <article>${html}</article>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [htmlPreview, isJsonContent, markdown, mdFromJsonHtml, runWorker]);

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

  return (
    <div className="min-h-screen bg-white">
      <EditorHeader />

      <main
        className="w-full py-4 pb-20 print:py-0 print:pb-0 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-white/90 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Drop file here</p>
              <p className="text-xs text-gray-400">CSV, Excel, PDF, Word, JSON, Markdown</p>
            </div>
          </div>
        )}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div
            ref={containerRef}
            className={`flex gap-4 lg:gap-0 ${
              showPreview
                ? 'flex-col lg:flex-row'
                : 'flex-col'
            }`}
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <InputPanel
              markdown={markdown}
              setMarkdown={setMarkdown}
              fullContentRef={fullContentRef}
              inputRef={inputRef}
              fileRef={fileRef}
              isJsonContent={isJsonContent}
              isProcessing={isProcessing}
              showPreview={showPreview}
              splitRatio={splitRatio}
              handleFileUpload={handleFileUpload}
              handlePaste={handlePaste}
              checkScroll={checkScroll}
              stats={stats}
            />

            {showPreview && (
              <SplitDragHandle
                isDraggingSplit={isDraggingSplit}
                setIsDraggingSplit={setIsDraggingSplit}
                setSplitRatio={setSplitRatio}
                containerRef={containerRef}
              />
            )}

            {showPreview && (
              <OutputPanel
                splitRatio={splitRatio}
                outputTab={outputTab}
                setOutputTab={setOutputTab}
                availableTabs={availableTabs}
                showToc={showToc}
                setShowToc={setShowToc}
                toc={toc}
                isCopied={isCopied}
                handleCopyOutput={handleCopyOutput}
                handleExportPDF={handleExportPDF}
                handleReadingMode={handleReadingMode}
                handlePrint={handlePrint}
                previewTruncation={previewTruncation}
                isJsonContent={isJsonContent}
                largFileLineLimit={LARGE_FILE_LINE_LIMIT}
                outputRef={outputRef}
                checkScroll={checkScroll}
                htmlPreview={htmlPreview}
                mdFromJsonHtml={mdFromJsonHtml}
                parsedJson={parsedJson}
                jsonError={jsonError}
                treeData={treeData}
                toonOutput={toonOutput}
                mdFromJson={mdFromJson}
              />
            )}
          </div>
        </div>
        
        {/* Global Scroll to Top */}
        {showScrollTop && !isFullscreen && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-16 right-6 p-2 bg-white border border-gray-200 text-gray-400 rounded-full hover:text-gray-700 transition z-40 print:hidden"
            title="Scroll to Top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </main>

      <AppFooter fixed />

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
