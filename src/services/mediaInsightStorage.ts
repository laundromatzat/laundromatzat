import {
  AnalysisResult,
  MediaType,
} from "../pages/tools-integrations/media-insight/types";

const DB_NAME = "laundromatzat-media-insight";
const STORE_NAME = "analyses";
const DB_VERSION = 1;

const getIndexedDBFactory = (): IDBFactory | undefined => {
  if (typeof globalThis === "undefined") return undefined;

  const g = globalThis as typeof globalThis & {
    mozIndexedDB?: IDBFactory;
    webkitIndexedDB?: IDBFactory;
    msIndexedDB?: IDBFactory;
  };

  return g.indexedDB ?? g.mozIndexedDB ?? g.webkitIndexedDB ?? g.msIndexedDB;
};

const indexedDBFactory = getIndexedDBFactory();

export type StoredAnalysis = {
  id: string;
  fileName: string;
  mediaType: MediaType;
  createdAt: number;
  result: AnalysisResult;
};

export const isMediaInsightStorageSupported = (): boolean =>
  Boolean(indexedDBFactory);

const openDatabase = async (): Promise<IDBDatabase> => {
  if (!indexedDBFactory)
    throw new Error("IndexedDB is not available in this environment.");

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("Failed to open media insight storage.")
      );
  });
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  const db = await openDatabase();

  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    let hasResult = false;
    let value: T | undefined;
    let settled = false;

    const done = () => {
      if (!settled) {
        settled = true;
        db.close();
        resolve((hasResult ? value : undefined) as T);
      }
    };

    const fail = (err: unknown) => {
      if (!settled) {
        settled = true;
        db.close();
        reject(err);
      }
    };

    let req: IDBRequest<T> | void;
    try {
      req = action(store);
    } catch (e) {
      fail(e);
      return;
    }

    if (req) {
      req.onsuccess = () => {
        hasResult = true;
        value = req.result;
      };
      req.onerror = () =>
        fail(req.error ?? new Error("Media insight storage request failed."));
    }

    tx.oncomplete = done;
    tx.onabort = () =>
      fail(tx.error ?? new Error("Media insight storage transaction aborted."));
    tx.onerror = () =>
      fail(tx.error ?? new Error("Media insight storage transaction failed."));
  });
};

export const persistAnalysis = async (
  record: StoredAnalysis
): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction("readwrite", (store) => store.put(record));
  return true;
};

export const loadAnalyses = async (): Promise<StoredAnalysis[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<StoredAnalysis[]>("readonly", (store) =>
    store.getAll()
  );
  return Array.isArray(records)
    ? records.sort((a, b) => b.createdAt - a.createdAt)
    : [];
};

export const deleteAnalysis = async (analysisId: string): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.delete(analysisId));
};

export const clearAnalyses = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.clear());
};
