import { formatJson, jsonToToon, buildTree } from '@/lib/json';
import { parseMarkdown, autoFormat } from '@/lib/markdown';

function csvToMarkdownTable(csv: string): string {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return '';

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const rows = lines.map(parseRow);
  const header = rows[0];
  const separator = header.map(() => '---');
  const mdRows = [header, separator, ...rows.slice(1)];
  return mdRows.map(r => '| ' + r.join(' | ') + ' |').join('\n');
}

const MIME_MAP: Record<string, string> = {
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  htm: 'text/html',
};

function resolveMimeType(mimeType: string, fileName?: string): string {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
  if (!fileName) return mimeType || 'application/octet-stream';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_MAP[ext] || mimeType || 'application/octet-stream';
}

self.addEventListener('message', async (e) => {
  const { id, type, payload } = e.data;

  try {
    let result;
    switch (type) {
      case 'JSON_PARSE':
        result = JSON.parse(payload);
        break;
      case 'JSON_FORMAT':
        result = formatJson(payload);
        break;
      case 'JSON_TO_TOON':
        result = jsonToToon(payload);
        break;
      case 'JSON_TREE':
        result = buildTree(payload);
        break;
      case 'MD_PARSE':
        result = parseMarkdown(payload.content, payload.format);
        break;
      case 'MD_FORMAT':
        result = autoFormat(payload);
        break;
      case 'KREUZBERG_EXTRACT': {
        const mime = resolveMimeType(payload.mimeType, payload.fileName);

        // CSV: parse natively to markdown table
        if (mime === 'text/csv') {
          const text = new TextDecoder().decode(payload.data);
          result = csvToMarkdownTable(text);
          break;
        }

        // Import directly from pkg to let webpack handle the WASM URL resolution
        // @ts-ignore - no types for direct pkg import
        const { extractBytes, init } = await import('@kreuzberg/wasm/dist/pkg/kreuzberg_wasm.js');
        init();
        const kreuzbergResult = await extractBytes(payload.data, mime, { output_format: 'markdown' });
        result = kreuzbergResult.content;
        break;
      }
      default:
        throw new Error('Unknown action: ' + type);
    }
    self.postMessage({ id, success: true, result });
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message });
  }
});
