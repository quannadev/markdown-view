import { RefObject, ReactNode } from 'react';
import { Book, Copy, Check, FileDown, Maximize2, Printer, AlertTriangle } from 'lucide-react';
import { TreeNodeView } from '@/components/TreeNodeView';
import { TreeNode } from '@/lib/json';

type OutputTab = 'formatted' | 'tree' | 'toon' | 'md';

interface OutputPanelProps {
  splitRatio: number;
  outputTab: OutputTab;
  setOutputTab: (tab: OutputTab) => void;
  availableTabs: { key: OutputTab; label: string }[];
  showToc: boolean;
  setShowToc: (v: boolean) => void;
  toc: { id: string; text: string; level: number }[];
  isCopied: boolean;
  handleCopyOutput: () => void;
  handleExportPDF: () => void;
  handleReadingMode: () => void;
  handlePrint: () => void;
  previewTruncation: { isTruncated: boolean; totalLines: number };
  isJsonContent: boolean;
  largFileLineLimit: number;
  outputRef: RefObject<HTMLDivElement | null>;
  checkScroll: () => void;
  // Render data
  htmlPreview: string;
  mdFromJsonHtml: string;
  parsedJson: any;
  jsonError: string | null;
  treeData: TreeNode | null;
  toonOutput: string;
  mdFromJson: string;
}

export function OutputPanel({
  splitRatio,
  outputTab,
  setOutputTab,
  availableTabs,
  showToc,
  setShowToc,
  toc,
  isCopied,
  handleCopyOutput,
  handleExportPDF,
  handleReadingMode,
  handlePrint,
  previewTruncation,
  isJsonContent,
  largFileLineLimit,
  outputRef,
  checkScroll,
  htmlPreview,
  mdFromJsonHtml,
  parsedJson,
  jsonError,
  treeData,
  toonOutput,
}: OutputPanelProps) {

  const renderOutput = () => {
    if (outputTab === 'md') {
      if (isJsonContent) {
        return mdFromJsonHtml ? (
          <article
            className="max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: mdFromJsonHtml }}
          />
        ) : (
          <div className="text-gray-400 text-sm">Converting...</div>
        );
      }
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
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
      style={{ flex: `0 0 ${100 - splitRatio}%` }}
    >
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex justify-between items-center gap-2">
        <div className="flex gap-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setOutputTab(tab.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                outputTab === tab.key
                  ? 'bg-white text-gray-900 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5">
          {outputTab === 'md' && toc.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              className={`p-1.5 rounded transition ${
                showToc
                  ? 'text-gray-900 bg-gray-200'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title={showToc ? 'Hide TOC' : 'Show TOC'}
            >
              <Book size={16} />
            </button>
          )}
          <button
            onClick={handleCopyOutput}
            className={`p-1.5 rounded transition ${
              isCopied
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            title={isCopied ? 'Copied' : 'Copy Output'}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleExportPDF}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
            title="Export PDF"
          >
            <FileDown size={16} />
          </button>
          {outputTab === 'md' && (
            <button
              onClick={handleReadingMode}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
              title="Reading Mode"
            >
              <Maximize2 size={16} />
            </button>
          )}
          <button
            onClick={handlePrint}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition"
            title="Print"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>
      {previewTruncation.isTruncated && outputTab === 'md' && !isJsonContent && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border-b border-amber-100 text-amber-700 text-xs">
          <AlertTriangle size={12} className="flex-shrink-0" />
          <span>Preview limited to {largFileLineLimit.toLocaleString()} / {previewTruncation.totalLines.toLocaleString()} lines</span>
        </div>
      )}
      <div data-print-content className="overflow-hidden p-4 bg-white flex-1 flex gap-4 relative">
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
  );
}
