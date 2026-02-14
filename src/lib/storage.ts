export interface StoredDocument {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'mdview_documents';
const CURRENT_KEY = 'mdview_current';

export function saveDocument(name: string, content: string): StoredDocument {
  const documents = getDocuments();
  const id = Date.now().toString();
  const doc: StoredDocument = {
    id,
    name,
    content,
    timestamp: Date.now(),
  };
  
  documents.push(doc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  setCurrentDocument(id);
  
  return doc;
}

export function updateDocument(id: string, name: string, content: string): StoredDocument | null {
  const documents = getDocuments();
  const index = documents.findIndex(d => d.id === id);
  
  if (index === -1) return null;
  
  documents[index] = {
    id,
    name,
    content,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  return documents[index];
}

export function getDocuments(): StoredDocument[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

export function getDocument(id: string): StoredDocument | null {
  const documents = getDocuments();
  return documents.find(d => d.id === id) || null;
}

export function deleteDocument(id: string): boolean {
  const documents = getDocuments();
  const filtered = documents.filter(d => d.id !== id);
  
  if (filtered.length === documents.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  
  const currentId = getCurrentDocument();
  if (currentId === id) {
    const latest = filtered[filtered.length - 1];
    if (latest) setCurrentDocument(latest.id);
    else clearCurrentDocument();
  }
  
  return true;
}

export function setCurrentDocument(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_KEY, id);
}

export function getCurrentDocument(): string | null {
  if (typeof window === 'undefined') return null;
  
  const id = localStorage.getItem(CURRENT_KEY);
  if (id) {
    const doc = getDocument(id);
    if (doc) return id;
  }
  
  // Return the latest document if current is not found
  const documents = getDocuments();
  if (documents.length > 0) {
    return documents[documents.length - 1].id;
  }
  
  return null;
}

export function clearCurrentDocument(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_KEY);
}
