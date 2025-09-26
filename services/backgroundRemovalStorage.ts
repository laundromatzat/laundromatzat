const DB_NAME = 'laundromatzat-background-removal';
const STORE_NAME = 'processed-images';
const DB_VERSION = 1;

const getIndexedDBFactory = (): IDBFactory | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const globalRef = globalThis as typeof globalThis & {
    mozIndexedDB?: IDBFactory;
    webkitIndexedDB?: IDBFactory;
    msIndexedDB?: IDBFactory;
  };

  return globalRef.indexedDB ?? globalRef.mozIndexedDB ?? globalRef.webkitIndexedDB ?? globalRef.msIndexedDB;
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
  if (!indexedDBFactory) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const { result } = request;
      if (!result.objectStoreNames.contains(STORE_NAME)) {
        result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open background removal storage.'));
    };
  });
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> => {
  const database = await openDatabase();

  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    let hasResult = false;
    let resultValue: T | undefined;
    let settled = false;

    const finishSuccess = () => {
      if (!settled) {
        settled = true;
        database.close();
        resolve((hasResult ? resultValue : undefined) as T);
      }
    };

    const finishError = (error: unknown) => {
      if (!settled) {
        settled = true;
        database.close();
        reject(error);
      }
    };

    let request: IDBRequest<T> | void;
    try {
      request = action(store);
    } catch (error) {
      finishError(error);
      return;
    }

    if (request) {
      request.onsuccess = () => {
        hasResult = true;
        resultValue = request.result;
      };
      request.onerror = () => {
        finishError(request?.error ?? new Error('Background removal storage request failed.'));
      };
    }

    transaction.oncomplete = () => {
      finishSuccess();
    };

    transaction.onabort = () => {
      finishError(transaction.error ?? new Error('Background removal storage transaction aborted.'));
    };

    transaction.onerror = () => {
      finishError(transaction.error ?? new Error('Background removal storage transaction failed.'));
    };
  });
};

export const persistBackgroundRemovalJob = async (
  record: StoredBackgroundRemovalJob,
): Promise<boolean> => {
  if (!indexedDBFactory) {
    return false;
  }

  await runTransaction('readwrite', store => store.put(record));
  return true;
};

export const loadBackgroundRemovalJobs = async (): Promise<StoredBackgroundRemovalJob[]> => {
  if (!indexedDBFactory) {
    return [];
  }

  const records = await runTransaction<StoredBackgroundRemovalJob[]>('readonly', store => store.getAll());
  if (!Array.isArray(records)) {
    return [];
  }

  return records;
};

export const deleteBackgroundRemovalJob = async (jobId: string): Promise<void> => {
  if (!indexedDBFactory) {
    return;
  }

  await runTransaction('readwrite', store => store.delete(jobId));
};

export const clearBackgroundRemovalJobs = async (): Promise<void> => {
  if (!indexedDBFactory) {
    return;
  }

  await runTransaction('readwrite', store => store.clear());
};
