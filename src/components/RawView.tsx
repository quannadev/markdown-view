'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { parseMarkdown } from '@/lib/markdown';
import { formatJson, jsonToToon } from '@/lib/json';

type Format = 'json' | 'markdown' | 'toon' | 'html';

function processContent(content: string, format: Format): { output: string; error: string | null } {
  try {
    switch (format) {
      case 'json':
        return { output: formatJson(content), error: null };
      case 'toon':
        return { output: jsonToToon(content), error: null };
      case 'markdown':
        return { output: parseMarkdown(content), error: null };
      case 'html':
        return { output: content, error: null };
      default:
        return { output: content, error: `Unknown format: ${format}` };
    }
  } catch (e) {
    return { output: '', error: (e as Error).message };
  }
}

export default function RawView() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');
  const format = searchParams.get('format') as Format | null;

  const result = useMemo(() => {
    if (!content || !format) return null;
    return processContent(content, format);
  }, [content, format]);

  if (!result) return null;

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-700 font-bold text-lg mb-2">Error</h2>
          <pre className="text-red-600 text-sm font-mono">{result.error}</pre>
        </div>
      </div>
    );
  }

  if (format === 'markdown') {
    return (
      <div className="min-h-screen bg-white p-8">
        <article
          className="max-w-4xl mx-auto text-gray-900"
          dangerouslySetInnerHTML={{ __html: result.output }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <pre className="max-w-4xl mx-auto text-sm font-mono whitespace-pre-wrap break-words text-gray-900 bg-white rounded-lg border border-gray-200 p-6">
        {result.output}
      </pre>
    </div>
  );
}
