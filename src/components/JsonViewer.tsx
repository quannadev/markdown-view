'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { jsonToToon, buildTree, TreeNode } from '@/lib/json';
import { useParseWorker } from '@/hooks/useParseWorker';

type OutputTab = 'formatted' | 'tree' | 'toon';

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

export default function JsonViewer() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>('formatted');
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedObject, setParsedObject] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const runWorker = useParseWorker();

  // Async parse whenever input changes
  useEffect(() => {
    if (!input.trim()) {
      setParsedObject(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await runWorker<any>('JSON_PARSE', input);
        setParsedObject(result);
        setError(null);
      } catch (e: any) {
        setError(e.message);
        setParsedObject(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input, runWorker]);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setIsProcessing(true);
    try {
      const formatted = await runWorker<string>('JSON_FORMAT', text);
      setInput(formatted);
      setError(null);
    } catch {
      setInput(text);
    } finally {
      setIsProcessing(false);
    }
  }, [runWorker]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setIsProcessing(true);
      try {
        const formatted = await runWorker<string>('JSON_FORMAT', text);
        setInput(formatted);
        setError(null);
      } catch {
        setInput(text);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [runWorker]);

  const handleFormat = useCallback(async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const formatted = await runWorker<string>('JSON_FORMAT', input);
      setInput(formatted);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  }, [input, runWorker]);

  const handleCopy = useCallback(async () => {
    let text = '';
    if (outputTab === 'formatted') text = parsedObject ? JSON.stringify(parsedObject, null, 2) : '';
    else if (outputTab === 'toon') {
      try { text = await runWorker<string>('JSON_TO_TOON', input); } catch { text = ''; }
    } else text = input;

    if (!text) return;
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [outputTab, parsedObject, input, runWorker]);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedObject(null);
    setError(null);
  }, []);

  const [treeData, setTreeData] = useState<TreeNode | null>(null);

  // Update tree data when parsedObject changes and tab is tree
  useEffect(() => {
    if (outputTab === 'tree' && parsedObject) {
      runWorker<TreeNode>('JSON_TREE', parsedObject).then(setTreeData);
    }
  }, [outputTab, parsedObject, runWorker]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 font-bold text-amber-600 animate-pulse">
                Processing...
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 border-b-2 border-amber-700 px-4 py-3 flex justify-between items-center gap-3">
            <h3 className="text-sm font-bold text-white">JSON Input</h3>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
              >
                Upload
              </button>
              <button
                onClick={handleFormat}
                className="px-3 py-1 bg-yellow-300 hover:bg-yellow-400 text-gray-900 rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
              >
                Format
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-red-400 hover:bg-red-500 text-white rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs"
              >
                Clear
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-xs font-mono">
              {error}
            </div>
          )}
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePaste}
            placeholder='Paste JSON here or upload a .json file...'
            className="w-full h-96 xl:h-screen p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 placeholder-gray-400 border-0 focus:bg-white focus:ring-0 transition-colors flex-1"
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden shadow-lg flex flex-col">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 border-b-2 border-teal-800 px-4 py-3 flex justify-between items-center gap-2">
            <div className="flex gap-1">
              {(['formatted', 'tree', 'toon'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setOutputTab(tab)}
                  className={`px-3 py-1 rounded font-bold text-xs transition ${
                    outputTab === tab
                      ? 'bg-white text-teal-700'
                      : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}
                >
                  {tab === 'formatted' ? 'Formatted' : tab === 'tree' ? 'Tree' : 'TOON'}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              disabled={!parsedObject}
              className={`px-3 py-1 rounded font-bold transition transform hover:scale-105 active:scale-95 text-xs disabled:opacity-50 ${
                isCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="h-96 xl:h-screen overflow-auto p-4 bg-white flex-1">
            {!parsedObject ? (
              <div className="text-gray-400 text-sm">
                {input.trim() ? 'Invalid JSON' : 'Output will appear here...'}
              </div>
            ) : outputTab === 'tree' ? (
              <div className="text-sm font-mono">
                {treeData ? <TreeNodeView node={treeData} /> : 'Building tree...'}
              </div>
            ) : outputTab === 'toon' ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
                {/* We'll calculate TOON on the fly or in effect, for simplicity here just show message if it takes time */}
                Processing TOON...
              </pre>
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-900">
                {JSON.stringify(parsedObject, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
