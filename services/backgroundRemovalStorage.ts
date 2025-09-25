const DB_NAME = 'laundromatzat-background-removal';
const STORE_NAME = 'results';
const DB_VERSION = 1;

const isIndexedDbAvailable = typeof window !== 'undefined' && 'indexedDB' in window;

export type StoredBackgroundRemovalResult = {
  id: string;
  fileName: string;
  sourceDataUrl: string | null;
  resultBlob: Blob;
  createdAt: number;
};

type StoredBackgroundRemovalRecord = StoredBackgroundRemovalResult;

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open background removal database.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const runTransaction = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => void | T | Promise<T>): Promise<T> => {
  if (!isIndexedDbAvailable) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  const db = await openDatabase();

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let actionResult: T | undefined;
      let settled = false;

      transaction.oncomplete = () => {
        if (!settled) {
          resolve((actionResult as T) ?? (undefined as T));
          settled = true;
        }
      };
      transaction.onerror = () => {
        if (!settled) {
          settled = true;
          reject(transaction.error ?? new Error('Background removal storage transaction failed.'));
        }
      };

      void Promise.resolve(action(store))
        .then(result => {
          actionResult = result as T;
        })
        .catch(error => {
          if (!settled) {
            settled = true;
            reject(error);
          }
        });
    });
  } finally {
    db.close();
  }
};

export type SaveBackgroundRemovalResultInput = {
  id: string;
  fileName: string;
  sourceDataUrl: string | null;
  resultBlob: Blob;
};

export const saveBackgroundRemovalResult = async (
  input: SaveBackgroundRemovalResultInput,
): Promise<void> => {
  if (!isIndexedDbAvailable) {
    return;
  }

  await runTransaction('readwrite', store => {
    const record: StoredBackgroundRemovalRecord = {
      ...input,
      createdAt: Date.now(),
    };
    store.put(record);
  });
};

export const getStoredBackgroundRemovalResults = async (): Promise<StoredBackgroundRemovalResult[]> => {
  if (!isIndexedDbAvailable) {
    return [];
  }

  return runTransaction('readonly', store => {
    return new Promise<StoredBackgroundRemovalResult[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result ?? []) as StoredBackgroundRemovalRecord[];
        resolve(records.sort((a, b) => b.createdAt - a.createdAt));
      };
      request.onerror = () => {
        reject(request.error ?? new Error('Failed to read saved background removal results.'));
      };
    });
  });
};

export const deleteStoredBackgroundRemovalResult = async (id: string): Promise<void> => {
  if (!isIndexedDbAvailable) {
    return;
  }

  await runTransaction('readwrite', store => {
    store.delete(id);
  });
};

export const clearStoredBackgroundRemovalResults = async (): Promise<void> => {
  if (!isIndexedDbAvailable) {
    return;
  }

  await runTransaction('readwrite', store => {
    store.clear();
  });
};
