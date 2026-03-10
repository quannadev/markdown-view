'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParseWorker } from '@/hooks/useParseWorker';
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

const BASE = 'https://mdview.quanna.dev';

const API_EXAMPLES: { label: string; url: string; desc: string }[] = [
  {
    label: 'Render Markdown',
    url: `${BASE}/?content=%23%20Hello%20World%0AThis%20is%20**bold**%20text.&format=markdown`,
    desc: 'Renders Markdown content as styled HTML',
  },
  {
    label: 'Format JSON',
    url: `${BASE}/?content=%7B%22name%22%3A%22MDView%22%2C%22version%22%3A1%7D&format=json`,
    desc: 'Pretty-prints JSON with 2-space indentation',
  },
  {
    label: 'Convert JSON to TOON',
    url: `${BASE}/?content=%7B%22name%22%3A%22MDView%22%2C%22users%22%3A%5B%7B%22id%22%3A1%2C%22role%22%3A%22admin%22%7D%2C%7B%22id%22%3A2%2C%22role%22%3A%22user%22%7D%5D%7D&format=toon`,
    desc: 'Converts JSON to Token-Oriented Object Notation for AI prompts',
  },
  {
    label: 'Render HTML',
    url: `${BASE}/?content=%3Ch1%3EHello%3C%2Fh1%3E%3Cp%3ERaw%20HTML%20render%3C%2Fp%3E&format=html`,
    desc: 'Renders raw HTML content directly',
  },
];

function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
      <div
        className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        {hasChildren && (
          <span className="text-gray-400 w-4 text-center flex-shrink-0 select-none">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="json-key font-semibold">{node.key}</span>
        <span className="text-gray-400 mx-0.5">:</span>
        {hasChildren ? (
          <span className="text-gray-500 text-xs">{String(node.value)}</span>
        ) : (
          <span className={`json-value-${node.type}`}>
            {node.type === 'string' ? `"${String(node.value)}"` : String(node.value)}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNodeView key={`${child.key}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApiDocs() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-b-2 border-indigo-800 px-6 py-4">
            <h2 className="text-lg font-bold text-white">URL API</h2>
            <p className="text-indigo-200 text-sm mt-1">
              Format content via URL query parameters - no UI needed
            </p>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Usage</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                {BASE}/?<span className="text-green-400">content</span>=...&<span className="text-green-400">format</span>=<span className="text-yellow-300">json</span> | <span className="text-yellow-300">toon</span> | <span className="text-yellow-300">markdown</span> | <span className="text-yellow-300">html</span>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Parameters</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Param</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Required</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2 font-mono text-indigo-600">content</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">URL-encoded content to process. Use <code className="bg-gray-100 px-1 rounded text-xs">encodeURIComponent()</code></td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2 font-mono text-indigo-600">format</td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">json</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">toon</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">markdown</span>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">html</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Formats</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'json', desc: 'Pretty-print JSON (2-space indent)' },
                  { name: 'toon', desc: 'Convert JSON to TOON for AI/LLM prompts' },
                  { name: 'markdown', desc: 'Render Markdown as styled HTML' },
                  { name: 'html', desc: 'Render raw HTML directly' },
                ].map((f) => (
                  <div key={f.name} className="border border-gray-200 rounded-lg p-3">
                    <span className="font-mono font-bold text-indigo-600 text-sm">{f.name}</span>
                    <p className="text-gray-600 text-xs mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Special characters must be URL-encoded. Use{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">encodeURIComponent()</code> in JavaScript or encode manually:{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">#</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%23</code>,{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">{`{`}</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%7B</code>,{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">space</code> ={'>'}{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">%20</code>
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Try it</h3>
              <div className="space-y-3">
                {API_EXAMPLES.map((ex) => (
                  <div key={ex.label} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-gray-800">{ex.label}</h4>
                      <a
                        href={ex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition"
                      >
                        Open
                      </a>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">{ex.desc}</p>
                    <div className="bg-gray-50 rounded p-2 font-mono text-xs text-gray-700 break-all">
                      {ex.url}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">JavaScript Example</h3>
              <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">{`const content = encodeURIComponent(JSON.stringify({
  name: "MDView",
  features: ["markdown", "json", "toon"]
}));

// Open formatted JSON
window.open(\`${BASE}/?content=\${content}&format=json\`);

// Open TOON conversion
window.open(\`${BASE}/?content=\${content}&format=toon\`);`}</pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
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
  const runWorker = useParseWorker();

  // JSON-specific state
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [toonOutput, setToonOutput] = useState<string>('');
  const [mdFromJson, setMdFromJson] = useState<string>('');
  const [mdFromJsonHtml, setMdFromJsonHtml] = useState<string>('');

  // Auto-detect if content is valid JSON
  const isJsonContent = useMemo(() => {
    const trimmed = markdown.trim();
    if (!trimmed) return false;
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }, [markdown]);

  // Load documents from storage
  useEffect(() => {
    const docs = getDocuments();
    setDocuments(docs);

    const currentId = getCurrentDocument();
    if (currentId) {
      const doc = getDocument(currentId);
      if (doc) {
        setCurrentDocId(currentId);
        setMarkdown(doc.content);
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
        const result = await runWorker<string>('MD_PARSE', { content: markdown, format: 'markdown' });
        setHtmlPreview(result);
      } catch (e) {
        console.error('Markdown parse error:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [markdown, outputTab, isJsonContent, runWorker]);

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

  // Auto-save on interval
  useEffect(() => {
    if (!markdown || isNewDocument || !currentDocId) return;

    const timer = setTimeout(() => {
      updateDocument(currentDocId, documentName, markdown);
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
          setMarkdown(formatted);
          setJsonError(null);
        } catch {
          setMarkdown(text);
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

    // Other files: extract with kreuzberg
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const mimeType = file.type || 'text/plain';

        const { extractFile } = await import('@/lib/extract');
        const result = await extractFile(data, mimeType, file.name);
        setMarkdown(result);
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
  }, [runWorker]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const types = e.clipboardData.types;

    let mimeType: string | null = null;
    let contentToExtract: string | null = null;
    let fileData: Uint8Array | null = null;

    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const file = e.clipboardData.files[0];
      const buffer = await file.arrayBuffer();
      fileData = new Uint8Array(buffer);
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
            setMarkdown(formatted);
          } catch {
            setMarkdown(text);
          }
          setOutputTab('formatted');
          setIsProcessing(false);
          return;
        } catch {}
      }
    }

    const insertText = (textToInsert: string) => {
      setMarkdown(prev => prev.substring(0, start) + textToInsert + prev.substring(end));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        textarea.focus();
      }, 0);
    };

    if (fileData && mimeType) {
      setIsProcessing(true);
      try {
        const { extractFile } = await import('@/lib/extract');
        const result = await extractFile(fileData, mimeType);
        insertText(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    } else if (contentToExtract && mimeType) {
      setIsProcessing(true);
      try {
        const { extractFile } = await import('@/lib/extract');
        const data = new TextEncoder().encode(contentToExtract);
        const result = await extractFile(data, mimeType);
        insertText(result);
      } catch (err) {
        console.error(err);
        insertText(contentToExtract);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [runWorker]);


  const handleExportPDF = useCallback(async () => {
    if (!markdown.trim()) {
      alert('Cannot export empty document');
      return;
    }

    try {
      // Generate HTML on demand: for JSON content, convert to markdown first
      let html: string;
      if (isJsonContent) {
        const md = await runWorker<string>('JSON_TO_MD', markdown);
        html = await runWorker<string>('MD_PARSE', { content: md, format: 'markdown' });
      } else {
        html = await runWorker<string>('MD_PARSE', { content: markdown, format: 'markdown' });
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
    let text = '';
    if (outputTab === 'formatted' && parsedJson) {
      text = JSON.stringify(parsedJson, null, 2);
    } else if (outputTab === 'toon') {
      text = toonOutput;
    } else if (outputTab === 'md') {
      text = mdFromJson;
    } else {
      text = markdown;
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
  }, [markdown, outputTab, parsedJson, toonOutput, mdFromJson]);

  const handleNewDocument = useCallback(() => {
    setMarkdown('');
    setDocumentName(`Untitled-${Date.now()}`);
    setCurrentDocId(null);
    setIsNewDocument(true);
  }, []);

  const handleLoadDocument = useCallback((docId: string) => {
    const doc = getDocument(docId);
    if (doc) {
      setCurrentDocId(docId);
      setMarkdown(doc.content);
      setDocumentName(doc.name);
      setIsNewDocument(false);
      setCurrentDocument(docId);
    }
  }, []);

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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white drop-shadow">MDView</h1>
            <span className="text-white/60 text-xs font-semibold">v0.1.0</span>
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
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
                  >
                    Upload
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
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste content here — Markdown, JSON, HTML, or upload a file..."
                className="w-full h-96 xl:h-screen p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 placeholder-gray-400 border-0 focus:bg-white focus:ring-0 transition-colors flex-1"
                spellCheck={!isJsonContent}
              />
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
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyOutput}
                      className={`px-3 py-1 rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs ${
                        isCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isCopied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
                    >
                      PDF
                    </button>
                  </div>
                </div>
                <div className="h-96 xl:h-screen overflow-auto p-4 bg-white flex-1">
                  {renderOutput()}
                </div>
              </div>
            )}
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-green-700 border-b-4 border-green-800 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center shadow-lg">
            <h2 className="text-2xl font-bold text-white">Full Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopyOutput}
                className={`px-4 py-2 rounded-lg font-bold transition transform hover:scale-105 active:scale-95 ${
                  isCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition transform hover:scale-105 active:scale-95"
              >
                Export
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition transform hover:scale-105 active:scale-95"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className="p-8 max-w-4xl mx-auto">
            <article
              className="max-w-none text-gray-900 prose-base"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
