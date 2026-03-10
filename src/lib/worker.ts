import { formatJson, jsonToToon, jsonToMarkdown, buildTree } from '@/lib/json';
import { parseMarkdown, autoFormat } from '@/lib/markdown';
import { encode } from 'gpt-tokenizer';

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
      case 'JSON_TO_MD':
        result = jsonToMarkdown(payload);
        break;
      case 'MD_PARSE':
        result = parseMarkdown(payload.content, payload.format);
        break;
      case 'MD_FORMAT':
        result = autoFormat(payload);
        break;
      case 'COUNT_STATS': {
        const text = payload.content || '';
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const lines = text.length === 0 ? 0 : text.split(/\n/).length;
        const tokens = text.length === 0 ? 0 : encode(text).length;
        let items = 0;
        if (payload.isJson) {
          try {
            const obj = JSON.parse(text);
            if (Array.isArray(obj)) {
              items = obj.length;
            } else if (obj !== null && typeof obj === 'object') {
              items = Object.keys(obj).length;
            }
          } catch (_) {}
        }
        result = { chars, words, lines, items, tokens };
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
