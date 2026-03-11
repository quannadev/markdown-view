'use client';

import { useRouter } from 'next/navigation';
import { AppFooter } from '@/components/AppFooter';
import {
  FileText, FileJson, Upload, Eye, Copy, Download,
  Zap, Table, Code, BookOpen, ArrowRight, Type, Hash, Bell
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Markdown Preview',
    description: 'Live-rendered preview with full syntax support — headings, lists, tables, code blocks, and more.',
  },
  {
    icon: Type,
    title: 'LaTeX Math Rendering',
    description: 'Render equations with $...$ inline and $$...$$ block syntax, powered by KaTeX.',
  },
  {
    icon: FileJson,
    title: 'JSON Viewer & Formatter',
    description: 'Auto-detect JSON with formatted output, collapsible tree view, and TOON conversion for AI prompts.',
  },
  {
    icon: Upload,
    title: 'File Upload & Conversion',
    description: 'Drag & drop CSV, Excel, PDF, and Word files — automatically converted to Markdown.',
  },
  {
    icon: Zap,
    title: 'Large File Performance',
    description: 'Optimized for millions of lines. Heavy parsing runs in Web Workers to keep UI responsive.',
  },
  {
    icon: Eye,
    title: 'Reading Mode',
    description: 'Distraction-free fullscreen reading with progressive chunked loading for large files. Press ESC to exit.',
  },
  {
    icon: Copy,
    title: 'One-Click Copy',
    description: 'Copy rendered content to clipboard — great for emails, docs, or chat apps.',
  },
  {
    icon: Download,
    title: 'Download & Export',
    description: 'Download as .md, .json, or .pdf from a single dropdown — context-aware based on active view.',
  },
  {
    icon: Table,
    title: 'Table of Contents',
    description: 'Auto-generated TOC from headings. Click to jump to any section.',
  },
  {
    icon: BookOpen,
    title: 'Document Management',
    description: 'Save and manage multiple documents locally in your browser.',
  },
  {
    icon: Code,
    title: 'URL API',
    description: 'Share content via URL parameters for instant formatted viewing.',
  },
  {
    icon: Hash,
    title: 'Content Statistics',
    description: 'Character, word, line count, and GPT token estimation in real time.',
  },
  {
    icon: Bell,
    title: 'Toast Notifications',
    description: 'Non-intrusive toast alerts for actions like copy, download, and errors — no more browser popups.',
  },
];

export default function IntroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header — matches editor */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold text-gray-900">MDView</h1>
            <span className="text-gray-400 text-xs hidden sm:inline">v0.1.0</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Editor
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="px-4 sm:px-6 py-12 text-center">
        <p className="text-gray-900 text-2xl sm:text-3xl font-bold mb-3">
          Markdown Viewer & Document Converter
        </p>
        <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto mb-6">
          A fast, open-source tool for viewing Markdown, formatting JSON, and converting documents — right in your browser.
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition"
        >
          Open Editor <ArrowRight size={16} />
        </button>
      </div>

      {/* Features Grid */}
      <main className="px-4 sm:px-6 pb-16">
        <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
          Features
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <f.icon size={18} className="text-gray-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* API Documentation */}
        <div className="max-w-5xl mx-auto mt-12">
          <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">
            URL API
          </h2>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Usage */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Usage</h3>
              <div className="bg-gray-50 rounded-md px-3 py-2 font-mono text-xs text-gray-700 overflow-x-auto">
                https://mdview.quanna.dev/?<span className="text-blue-600">content</span>=...&amp;<span className="text-blue-600">format</span>=<span className="text-amber-600">json</span> | <span className="text-amber-600">toon</span> | <span className="text-amber-600">markdown</span> | <span className="text-amber-600">html</span>
              </div>
            </div>

            {/* Formats */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Formats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'json', desc: 'Pretty-print JSON' },
                  { name: 'toon', desc: 'TOON for AI/LLM' },
                  { name: 'markdown', desc: 'Render as HTML' },
                  { name: 'html', desc: 'Raw HTML render' },
                ].map((f) => (
                  <div key={f.name} className="border border-gray-100 rounded-md px-3 py-2">
                    <span className="font-mono text-xs font-semibold text-gray-700">{f.name}</span>
                    <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Try it</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Render Markdown', url: 'https://mdview.quanna.dev/?content=%23%20Hello%20World%0AThis%20is%20**bold**%20text.&format=markdown', desc: 'Markdown → styled HTML' },
                  { label: 'Format JSON', url: 'https://mdview.quanna.dev/?content=%7B%22name%22%3A%22MDView%22%2C%22version%22%3A1%7D&format=json', desc: 'Pretty-print JSON' },
                  { label: 'JSON to TOON', url: 'https://mdview.quanna.dev/?content=%7B%22name%22%3A%22MDView%22%7D&format=toon', desc: 'Convert for AI prompts' },
                ].map((ex) => (
                  <div key={ex.label} className="flex items-center justify-between border border-gray-100 rounded-md px-3 py-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-700">{ex.label}</span>
                      <p className="text-gray-400 text-xs">{ex.desc}</p>
                    </div>
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 border border-gray-200 rounded px-2.5 py-1 hover:border-gray-400 hover:text-gray-700 transition whitespace-nowrap"
                    >
                      Open →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Example */}
            <div className="px-4 py-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">JavaScript Example</h3>
              <pre className="bg-gray-50 rounded-md px-3 py-2 font-mono text-xs text-gray-700 overflow-x-auto leading-relaxed">{`const content = encodeURIComponent(JSON.stringify({
  name: "MDView",
  features: ["markdown", "json", "toon"]
}));

window.open(\`https://mdview.quanna.dev/?content=\${content}&format=json\`);
window.open(\`https://mdview.quanna.dev/?content=\${content}&format=toon\`);`}</pre>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
