import { DevTask } from '../types/devTaskTypes';

const DB_NAME = 'laundromatzat-dev-tasks';
const STORE_NAME = 'tasks';
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

export const isDevTasksStorageSupported = (): boolean => Boolean(indexedDBFactory);

const openDatabase = async (): Promise<IDBDatabase> => {
  if (!indexedDBFactory)
    throw new Error('IndexedDB is not available in this environment.');

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open dev tasks storage.'));
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
        fail(req.error ?? new Error('Dev tasks storage request failed.'));
    }

    tx.oncomplete = done;
    tx.onabort = () =>
      fail(tx.error ?? new Error('Dev tasks storage transaction aborted.'));
    tx.onerror = () =>
      fail(tx.error ?? new Error('Dev tasks storage transaction failed.'));
  });
};

export const persistTask = async (task: DevTask): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction('readwrite', (store) => store.put(task));
  return true;
};

export const persistTasks = async (tasks: DevTask[]): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction('readwrite', (store) => {
    tasks.forEach((task) => store.put(task));
  });
  return true;
};

export const loadTasks = async (): Promise<DevTask[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<DevTask[]>('readonly', (store) =>
    store.getAll()
  );
  return Array.isArray(records)
    ? records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];
};

export const deleteTask = async (taskId: number): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction('readwrite', (store) => store.delete(taskId));
};

export const clearTasks = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction('readwrite', (store) => store.clear());
};
