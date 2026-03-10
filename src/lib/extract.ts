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

export async function extractFile(data: Uint8Array, mimeType: string, fileName?: string): Promise<string> {
  const mime = resolveMimeType(mimeType, fileName);

  // CSV: parse natively to markdown table
  if (mime === 'text/csv') {
    return csvToMarkdownTable(new TextDecoder().decode(data));
  }

  // @ts-ignore - direct pkg import for proper WASM URL resolution in browser
  const { extractBytes, init } = await import('@kreuzberg/wasm/dist/pkg/kreuzberg_wasm.js');
  init();
  const result = await extractBytes(data, mime, { output_format: 'markdown' });
  return result.content;
}
