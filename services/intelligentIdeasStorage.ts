import { OrganizedData } from "./intelligentIdeasService";

const DB_NAME = "laundromatzat-intelligent-ideas";
const STORE_NAME = "boards";
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

export type StoredBoard = {
  id: string;
  rawInput: string;
  createdAt: number;
  organizedData: OrganizedData;
};

export const isIntelligentIdeasStorageSupported = (): boolean =>
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
        request.error ?? new Error("Failed to open intelligent ideas storage.")
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
        fail(
          req.error ?? new Error("Intelligent ideas storage request failed.")
        );
    }

    tx.oncomplete = done;
    tx.onabort = () =>
      fail(
        tx.error ?? new Error("Intelligent ideas storage transaction aborted.")
      );
    tx.onerror = () =>
      fail(
        tx.error ?? new Error("Intelligent ideas storage transaction failed.")
      );
  });
};

export const persistBoard = async (record: StoredBoard): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction("readwrite", (store) => store.put(record));
  return true;
};

export const loadBoards = async (): Promise<StoredBoard[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<StoredBoard[]>("readonly", (store) =>
    store.getAll()
  );
  return Array.isArray(records)
    ? records.sort((a, b) => b.createdAt - a.createdAt)
    : [];
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.delete(boardId));
};

export const clearBoards = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.clear());
};
