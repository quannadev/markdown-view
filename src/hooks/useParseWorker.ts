import { useEffect, useRef, useCallback } from 'react';

export function useParseWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolves = useRef<Record<string, { resolve: Function; reject: Function }>>({});

  useEffect(() => {
    // Initialize Web Worker using Next.js compatible syntax
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), {
      type: 'module'
    });
    
    workerRef.current.onmessage = (e) => {
      const { id, success, result, error } = e.data;
      if (resolves.current[id]) {
        if (success) {
          resolves.current[id].resolve(result);
        } else {
          resolves.current[id].reject(new Error(error));
        }
        delete resolves.current[id];
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const runWorker = useCallback(<T,>(type: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      // Generate simple unique ID
      const id = Math.random().toString(36).substring(7);
      resolves.current[id] = { resolve, reject };
      workerRef.current.postMessage({ id, type, payload });
    });
  }, []);

  return runWorker;
}
