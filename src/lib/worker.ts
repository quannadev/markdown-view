import { formatJson, jsonToToon, buildTree } from '@/lib/json';
import { parseMarkdown, autoFormat } from '@/lib/markdown';

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
        const { extractBytes } = await import('@kreuzberg/wasm');
        const config = {
          outputFormat: 'markdown'
        };
        // @ts-ignore - kreuzberg types might mismatch strict outputFormat but should be fine
        const kreuzbergResult = await extractBytes(payload.data, payload.mimeType, config);
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
