import { extractFile } from '@/lib/extract';

self.addEventListener('message', async (e) => {
  const { id, type, payload } = e.data;

  try {
    let result;
    switch (type) {
      case 'EXTRACT_FILE': {
        const { data, mimeType, fileName } = payload;
        // data arrives as ArrayBuffer from postMessage transfer, convert to Uint8Array
        const uint8 = new Uint8Array(data);
        result = await extractFile(uint8, mimeType, fileName);
        break;
      }
      case 'CSV_TO_MD': {
        // Lightweight CSV-only path: extract as if CSV
        const encoder = new TextEncoder();
        const data = encoder.encode(payload.content);
        result = await extractFile(data, 'text/csv');
        break;
      }
      case 'JSON_DETECT': {
        // Try to parse as JSON — return boolean
        const trimmed = (payload as string).trim();
        if (!trimmed || !(trimmed.startsWith('{') || trimmed.startsWith('['))) {
          result = false;
        } else {
          try {
            JSON.parse(trimmed);
            result = true;
          } catch {
            result = false;
          }
        }
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
