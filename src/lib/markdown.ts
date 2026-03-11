import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import texmath from 'markdown-it-texmath';
import katex from 'katex';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
}).use(anchor, {
  slugify: s => String(s).trim().toLowerCase().replace(/[\s\W-]+/g, '-')
}).use(texmath, {
  engine: katex,
  delimiters: 'dollars',
  katexOptions: { throwOnError: false },
});


export function parseMarkdown(content: string, format: 'markdown' | 'html' | 'text' = 'markdown'): string {
  if (format === 'html') {
    // For HTML format, just render it directly
    return content;
  }
  
  if (format === 'text') {
    // For plain text, escape HTML and wrap in <pre> tags
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; line-height: 1.5;">${escaped}</pre>`;
  }
  
  // Default: markdown format
  return md.render(content);
}

export function autoFormat(content: string): string {
  let formatted = content;

  // Convert escaped newlines to actual newlines
  formatted = formatted.replace(/\\n/g, '\n');

  // Normalize line endings (handle \r\n, \r, and \n)
  formatted = formatted.replace(/\r\n/g, '\n');
  formatted = formatted.replace(/\r/g, '\n');

  // Split into lines for processing
  let lines = formatted.split('\n');

  // Process each line and build result
  let result: string[] = [];
  let previousWasEmpty = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for code block markers
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      previousWasEmpty = false;
      continue;
    }

    // Don't format inside code blocks
    if (inCodeBlock) {
      result.push(line);
      previousWasEmpty = false;
      continue;
    }

    const trimmedLine = line.trim();
    const isEmpty = trimmedLine.length === 0;

    // Check if this is a markdown element that needs spacing
    const isHeading = /^#{1,6}\s/.test(trimmedLine);
    const isList = /^[-*+]\s/.test(trimmedLine);
    const isNumberedList = /^\d+\.\s/.test(trimmedLine);
    const isBlockquote = /^>\s/.test(trimmedLine);
    const isPrevHeading = result.length > 0 && /^#{1,6}\s/.test(result[result.length - 1]?.trim() || '');
    const isPrevList = result.length > 0 && (/^[-*+]\s/.test(result[result.length - 1]?.trim() || '') || /^\d+\.\s/.test(result[result.length - 1]?.trim() || ''));

    // Add empty line before headings if needed (except at start)
    if (isHeading && result.length > 0 && !previousWasEmpty && !isPrevHeading) {
      result.push('');
    }

    // Add empty line before lists if needed
    if ((isList || isNumberedList) && result.length > 0 && !previousWasEmpty && !isPrevList) {
      result.push('');
    }

    // Add empty line before blockquotes if needed
    if (isBlockquote && result.length > 0 && !previousWasEmpty) {
      result.push('');
    }

    // Add the current line
    if (!isEmpty || !previousWasEmpty) {
      result.push(line);
    }

    previousWasEmpty = isEmpty;
  }

  // Join lines
  formatted = result.join('\n');

  // Remove multiple consecutive empty lines (keep max 1)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure trailing newline removed
  formatted = formatted.trim();

  return formatted;
}

/**
 * Convert markdown content to JSON.
 * - Tables → array of objects (header row as keys)
 * - Lists → arrays of strings
 * - Headings + paragraphs → structured sections
 * - TOON-like content → parsed key-value pairs
 */
export function markdownToJson(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '[]';

  // Try parsing as TOON first (key: value per line)
  const toonResult = tryParseToon(trimmed);
  if (toonResult) return JSON.stringify(toonResult, null, 2);

  // Try parsing as table(s)
  const tables = extractTables(trimmed);
  if (tables.length > 0 && tables.some(t => t.length > 0)) {
    return JSON.stringify(tables.length === 1 ? tables[0] : tables, null, 2);
  }

  // Parse as structured markdown
  return JSON.stringify(parseStructured(trimmed), null, 2);
}

function tryParseToon(content: string): any | null {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  // Check if it looks like TOON (key: value or key = value)
  const kvPattern = /^[\w\s.-]+[:=]/;
  const matchCount = lines.filter(l => kvPattern.test(l.trim())).length;
  if (matchCount / lines.length < 0.5) return null;

  const result: Record<string, any> = {};
  let currentKey = '';
  let currentIndent = 0;
  const stack: { obj: any; indent: number }[] = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    const trimmedLine = line.trim();

    const match = trimmedLine.match(/^([\w\s.-]+?)\s*[:=]\s*(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    const cleanKey = key.trim();

    // Find the right parent based on indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    if (value.trim()) {
      // Try to parse as number/boolean
      const parsed = tryParseValue(value.trim());
      parent[cleanKey] = parsed;
    } else {
      // Nested object
      parent[cleanKey] = {};
      stack.push({ obj: parent[cleanKey], indent });
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function tryParseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === 'none' || value === 'nil') return null;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function extractTables(content: string): Record<string, any>[][] {
  const tables: Record<string, any>[][] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect table: line with | chars, followed by separator (|---|)
    if (line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1]?.trim() || '';
      if (/^\|?[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?$/.test(nextLine)) {
        // Parse table header
        const headers = line.split('|').map(h => h.trim()).filter(Boolean);
        const tableRows: Record<string, any>[] = [];

        // Skip separator
        let j = i + 2;
        while (j < lines.length) {
          const rowLine = lines[j].trim();
          if (!rowLine.includes('|') || rowLine === '') break;
          const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean);
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            row[header] = tryParseValue(cells[idx] || '');
          });
          tableRows.push(row);
          j++;
        }

        if (tableRows.length > 0) {
          tables.push(tableRows);
        }
        i = j;
        continue;
      }
    }
    i++;
  }

  return tables;
}

function parseStructured(content: string): any {
  const lines = content.split('\n');
  const sections: any[] = [];
  let currentSection: any = null;
  let currentList: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentList && currentSection) {
        currentSection.items = currentList;
        currentList = null;
      }
      if (currentSection) sections.push(currentSection);
      currentSection = {
        heading: headingMatch[2],
        level: headingMatch[1].length,
        content: [],
      };
      continue;
    }

    // List item
    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1]);
      continue;
    }

    // End of list
    if (currentList && trimmed === '') {
      if (currentSection) {
        currentSection.items = currentList;
      } else {
        sections.push({ items: currentList });
      }
      currentList = null;
      continue;
    }

    // Regular paragraph text
    if (trimmed) {
      if (!currentSection) {
        currentSection = { content: [] };
      }
      currentSection.content.push(trimmed);
    }
  }

  // Flush remaining
  if (currentList && currentSection) {
    currentSection.items = currentList;
  } else if (currentList) {
    sections.push({ items: currentList });
  }
  if (currentSection) sections.push(currentSection);

  // Clean: remove empty content arrays
  for (const s of sections) {
    if (s.content && s.content.length === 0) delete s.content;
    if (s.content && s.content.length === 1) s.content = s.content[0];
  }

  return sections.length === 1 ? sections[0] : sections;
}
