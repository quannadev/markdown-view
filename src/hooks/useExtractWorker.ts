import { useEffect, useRef, useCallback } from 'react';

export function useExtractWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolves = useRef<Record<string, { resolve: Function; reject: Function }>>({});

  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/extract.worker.ts', import.meta.url), {
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

  const runExtract = useCallback(<T,>(type: string, payload: any, transfer?: Transferable[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Extract worker not initialized'));
        return;
      }
      const id = Math.random().toString(36).substring(7);
      resolves.current[id] = { resolve, reject };
      if (transfer && transfer.length > 0) {
        workerRef.current.postMessage({ id, type, payload }, transfer);
      } else {
        workerRef.current.postMessage({ id, type, payload });
      }
    });
  }, []);

  return runExtract;
}
