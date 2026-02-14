import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
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

  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n');

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
