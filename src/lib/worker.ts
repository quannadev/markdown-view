import { formatJson, jsonToToon, jsonToMarkdown, buildTree } from '@/lib/json';
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
      case 'JSON_TO_MD':
        result = jsonToMarkdown(payload);
        break;
      case 'MD_PARSE':
        result = parseMarkdown(payload.content, payload.format);
        break;
      case 'MD_FORMAT':
        result = autoFormat(payload);
        break;
      default:
        throw new Error('Unknown action: ' + type);
    }
    self.postMessage({ id, success: true, result });
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message });
  }
});
