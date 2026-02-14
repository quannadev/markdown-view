export function formatJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

// --- TOON (Token-Oriented Object Notation) Encoder ---

export function jsonToToon(input: string): string {
  const parsed = JSON.parse(input);
  return encodeToon(parsed, 0).trimEnd();
}

const INDENT = '  '; // 2 spaces per spec

function encodeToon(value: unknown, depth: number): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return encodeNumber(value);
  if (typeof value === 'string') return encodeString(value);
  if (Array.isArray(value)) return encodeArray(value, depth);
  if (typeof value === 'object') return encodeObject(value as Record<string, unknown>, depth);
  return String(value);
}

function encodeNumber(n: number): string {
  if (Object.is(n, -0)) return '0';
  if (!isFinite(n)) return 'null';
  // Canonical form: no exponent, no trailing zeros
  return String(n);
}

function encodeString(s: string): string {
  if (s === '') return '""';
  // Bare string if safe
  if (isBareString(s)) return s;
  // Quoted string with escaping
  return '"' + s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t') + '"';
}

function isBareString(s: string): boolean {
  if (!s || s !== s.trim()) return false;
  if (s === 'true' || s === 'false' || s === 'null') return false;
  if (s === '-' || s.startsWith('-')) return false;
  // Numeric-like patterns
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(s)) return false;
  if (/^0\d+$/.test(s)) return false;
  // Special chars
  if (/[:"\\[\]{}]/.test(s)) return false;
  // Control chars
  if (/[\x00-\x1f]/.test(s)) return false;
  // Contains comma (default delimiter)
  if (s.includes(',')) return false;
  return true;
}

function encodeToonKey(key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) return key;
  return '"' + key
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"') + '"';
}

function indent(depth: number): string {
  return INDENT.repeat(depth);
}

function isPrimitive(val: unknown): boolean {
  return val === null || typeof val !== 'object';
}

/** Check if array is tabular: all objects with identical keys, all primitive values */
function isTabular(arr: unknown[]): boolean {
  if (arr.length === 0) return false;
  if (!arr.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))) return false;
  const firstKeys = Object.keys(arr[0] as Record<string, unknown>).join(',');
  return arr.every(item => {
    const obj = item as Record<string, unknown>;
    if (Object.keys(obj).join(',') !== firstKeys) return false;
    return Object.values(obj).every(isPrimitive);
  });
}

function encodeArray(arr: unknown[], depth: number): string {
  if (arr.length === 0) return `[0]:`;

  // All primitives → inline
  if (arr.every(isPrimitive)) {
    const values = arr.map(v => encodeToon(v, depth)).join(',');
    return `[${arr.length}]: ${values}`;
  }

  // Tabular array (uniform objects with primitive values)
  if (isTabular(arr)) {
    const fields = Object.keys(arr[0] as Record<string, unknown>);
    const header = fields.map(encodeToonKey).join(',');
    const lines: string[] = [];
    lines.push(`[${arr.length}]{${header}}:`);
    for (const item of arr) {
      const obj = item as Record<string, unknown>;
      const row = fields.map(f => encodeToon(obj[f], depth + 1)).join(',');
      lines.push(`${indent(depth + 1)}${row}`);
    }
    return lines.join('\n');
  }

  // Mixed/non-uniform → list items
  const lines: string[] = [];
  lines.push(`[${arr.length}]:`);
  for (const item of arr) {
    if (isPrimitive(item)) {
      lines.push(`${indent(depth + 1)}- ${encodeToon(item, depth + 1)}`);
    } else if (Array.isArray(item)) {
      lines.push(`${indent(depth + 1)}- ${encodeArray(item, depth + 1)}`);
    } else {
      // Object as list item
      const obj = item as Record<string, unknown>;
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        lines.push(`${indent(depth + 1)}-`);
      } else {
        const [firstKey, firstVal] = entries[0];
        lines.push(`${indent(depth + 1)}- ${encodeKeyValue(firstKey, firstVal, depth + 1)}`);
        for (let i = 1; i < entries.length; i++) {
          const [k, v] = entries[i];
          lines.push(`${indent(depth + 1)}  ${encodeKeyValue(k, v, depth + 1)}`);
        }
      }
    }
  }
  return lines.join('\n');
}

function encodeKeyValue(key: string, value: unknown, depth: number): string {
  const k = encodeToonKey(key);
  if (isPrimitive(value)) {
    return `${k}: ${encodeToon(value, depth)}`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${k}[0]:`;
    if (value.every(isPrimitive)) {
      const vals = value.map(v => encodeToon(v, depth)).join(',');
      return `${k}[${value.length}]: ${vals}`;
    }
    // Complex array
    const arrStr = encodeArray(value, depth);
    return `${k}${arrStr}`;
  }
  // Nested object
  const lines: string[] = [];
  lines.push(`${k}:`);
  const obj = value as Record<string, unknown>;
  for (const [ck, cv] of Object.entries(obj)) {
    lines.push(`${indent(depth + 1)}${encodeKeyValue(ck, cv, depth + 1)}`);
  }
  return lines.join('\n');
}

function encodeObject(obj: Record<string, unknown>, depth: number): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '';
  const lines: string[] = [];
  for (const [key, value] of entries) {
    if (depth === 0) {
      lines.push(encodeKeyValue(key, value, depth));
    } else {
      lines.push(`${indent(depth)}${encodeKeyValue(key, value, depth)}`);
    }
  }
  return lines.join('\n');
}

// --- Tree utilities ---

export interface TreeNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: TreeNode[];
}

export function buildTree(obj: unknown, key: string = 'root'): TreeNode {
  if (obj === null) return { key, value: null, type: 'null' };
  if (typeof obj === 'string') return { key, value: obj, type: 'string' };
  if (typeof obj === 'number') return { key, value: obj, type: 'number' };
  if (typeof obj === 'boolean') return { key, value: obj, type: 'boolean' };

  if (Array.isArray(obj)) {
    return {
      key,
      value: `Array(${obj.length})`,
      type: 'array',
      children: obj.map((item, i) => buildTree(item, String(i))),
    };
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    return {
      key,
      value: `{${entries.length}}`,
      type: 'object',
      children: entries.map(([k, v]) => buildTree(v, k)),
    };
  }

  return { key, value: String(obj), type: 'string' };
}
