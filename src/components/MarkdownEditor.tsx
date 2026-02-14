'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseMarkdown, autoFormat } from '@/lib/markdown';
import {
  saveDocument,
  updateDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getCurrentDocument,
  setCurrentDocument,
  StoredDocument,
} from '@/lib/storage';
import JsonViewer from './JsonViewer';

type AppMode = 'markdown' | 'json' | 'api';

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
            {/* Usage */}
            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Usage</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                {BASE}/?<span className="text-green-400">content</span>=...&<span className="text-green-400">format</span>=<span className="text-yellow-300">json</span> | <span className="text-yellow-300">toon</span> | <span className="text-yellow-300">markdown</span> | <span className="text-yellow-300">html</span>
              </div>
            </section>

            {/* Params */}
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

            {/* Formats */}
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

            {/* Note */}
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

            {/* Examples */}
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

            {/* JS snippet */}
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
  const [mode, setMode] = useState<AppMode>('markdown');
  const [markdown, setMarkdown] = useState('');
  const [documentName, setDocumentName] = useState('Untitled');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formatType, setFormatType] = useState<'markdown' | 'html' | 'text'>('markdown');
  const [isCopied, setIsCopied] = useState(false);

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

  // Auto-save on interval
  useEffect(() => {
    if (!markdown || isNewDocument || !currentDocId) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      updateDocument(currentDocId, documentName, markdown);
      setIsSaving(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [markdown, documentName, currentDocId, isNewDocument]);

  const handleAutoFormat = useCallback(() => {
    const formatted = autoFormat(markdown);
    setMarkdown(formatted);
  }, [markdown]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Get the current textarea value and pasted content
    const textarea = e.currentTarget;
    setTimeout(() => {
      const pastedContent = textarea.value;
      const formatted = autoFormat(pastedContent);
      setMarkdown(formatted);
    }, 0);
  }, []);

  const handleSaveDocument = useCallback(async () => {
    if (!markdown.trim()) {
      alert('Cannot save empty document');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewDocument) {
        const doc = saveDocument(documentName, markdown);
        setCurrentDocId(doc.id);
        setIsNewDocument(false);
        setDocuments(getDocuments());
      } else if (currentDocId) {
        updateDocument(currentDocId, documentName, markdown);
        setDocuments(getDocuments());
      }
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setIsSaving(false);
    }
  }, [markdown, documentName, isNewDocument, currentDocId]);

  const handleExportPDF = useCallback(async () => {
    if (!markdown.trim()) {
      alert('Cannot export empty document');
      return;
    }

    try {
      const { exportPDF } = await import('@/lib/pdf');
      const htmlContent = parseMarkdown(markdown);
      const filename = documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await exportPDF(filename, htmlContent, documentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF');
    }
  }, [markdown, documentName]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!markdown.trim()) {
      alert('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy');
    }
  }, [markdown]);

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

  const htmlPreview = parseMarkdown(markdown, formatType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 border-b-4 border-blue-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-black text-white drop-shadow">MDView</h1>
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {(['markdown', 'json', 'api'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`px-4 py-1.5 rounded-md font-bold text-sm transition ${
                  mode === tab
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'markdown' ? 'Markdown' : tab === 'json' ? 'JSON' : 'API'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full bg-gray-50 py-8">
        {mode === 'api' ? (
          <ApiDocs />
        ) : mode === 'json' ? (
          <JsonViewer />
        ) : (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Editor and Preview */}
          <div
            className={`grid gap-6 ${
              showPreview
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* Editor */}
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-800 px-4 py-3 flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">📝 Input</h3>
                  <select
                    value={formatType}
                    onChange={(e) => setFormatType(e.target.value as 'markdown' | 'html' | 'text')}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold border border-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <button
                  onClick={handleAutoFormat}
                  className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
                >
                  🔧 Format
                </button>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste your content here..."
                className="w-full h-96 xl:h-screen p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 placeholder-gray-400 border-0 focus:bg-white focus:ring-0 transition-colors flex-1"
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 border-b-2 border-green-800 px-4 py-3 flex justify-between items-center gap-2">
                  <h3 className="text-sm font-bold text-white">📄 Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className={`px-3 py-1 rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs ${
                        isCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isCopied ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleSaveDocument}
                      disabled={isSaving}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
                    >
                      📄 Export
                    </button>
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
                    >
                      ⛶ Fullscreen
                    </button>
                  </div>
                </div>
                <div className="h-96 xl:h-screen overflow-auto p-4 bg-white flex-1">
                  <article
                    className="max-w-none text-gray-900"
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-green-700 border-b-4 border-green-800 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center shadow-lg">
            <h2 className="text-2xl font-bold text-white">📄 Full Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMarkdown}
                className={`px-4 py-2 rounded-lg font-bold transition transform hover:scale-105 active:scale-95 ${
                  isCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isCopied ? '✓ Copied' : '📋 Copy'}
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition transform hover:scale-105 active:scale-95"
              >
                📄 Export
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
