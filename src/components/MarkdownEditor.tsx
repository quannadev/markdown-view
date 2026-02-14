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
import { exportPDF } from '@/lib/pdf';

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('');
  const [documentName, setDocumentName] = useState('Untitled');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formatType, setFormatType] = useState<'markdown' | 'html' | 'text'>('markdown');

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
      const htmlContent = parseMarkdown(markdown);
      const filename = documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await exportPDF(filename, htmlContent, documentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF');
    }
  }, [markdown, documentName]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-4xl font-black text-white drop-shadow">📝 Markdown View</h1>
        </div>
      </header>

      <main className="w-full bg-gray-50 py-8">
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
      </main>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-green-700 border-b-4 border-green-800 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center shadow-lg">
            <h2 className="text-2xl font-bold text-white">📄 Full Preview</h2>
            <div className="flex gap-2">
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
