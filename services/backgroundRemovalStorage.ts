const DB_NAME = 'laundromatzat-background-removal';
const STORE_NAME = 'processed-images';
const DB_VERSION = 1;

const getIndexedDBFactory = (): IDBFactory | undefined => {
  if (typeof globalThis === 'undefined') return undefined;

  const g = globalThis as typeof globalThis & {
    mozIndexedDB?: IDBFactory;
    webkitIndexedDB?: IDBFactory;
    msIndexedDB?: IDBFactory;
  };

  return g.indexedDB ?? g.mozIndexedDB ?? g.webkitIndexedDB ?? g.msIndexedDB;
};

const indexedDBFactory = getIndexedDBFactory();

export type StoredBackgroundRemovalJob = {
  id: string;
  fileName: string;
  createdAt: number;
  sourceBlob: Blob;
  resultBlob: Blob;
};

export const isBackgroundRemovalStorageSupported = (): boolean => Boolean(indexedDBFactory);

const openDatabase = async (): Promise<IDBDatabase> => {
  if (!indexedDBFactory) throw new Error('IndexedDB is not available in this environment.');

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open background removal storage.'));
  });
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
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
      req.onerror = () => fail(req.error ?? new Error('Background removal storage request failed.'));
    }

    tx.oncomplete = done;
    tx.onabort = () => fail(tx.error ?? new Error('Background removal storage transaction aborted.'));
    tx.onerror = () => fail(tx.error ?? new Error('Background removal storage transaction failed.'));
  });
};

export const persistBackgroundRemovalJob = async (record: StoredBackgroundRemovalJob): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction('readwrite', store => store.put(record));
  return true;
};

export const loadBackgroundRemovalJobs = async (): Promise<StoredBackgroundRemovalJob[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<StoredBackgroundRemovalJob[]>('readonly', store => store.getAll());
  return Array.isArray(records) ? records : [];
};

export const deleteBackgroundRemovalJob = async (jobId: string): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction('readwrite', store => store.delete(jobId));
};

export const clearBackgroundRemovalJobs = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction('readwrite', store => store.clear());
};