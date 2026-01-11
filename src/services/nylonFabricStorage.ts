const DB_NAME = "laundromatzat-nylon-fabric";
const STORE_NAME = "designs";
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

export type StoredDesign = {
  id: string;
  projectName: string;
  description: string;
  createdAt: number;
  guideText: string;
  visuals: { stage: string; svg: string }[];
};

export const isNylonFabricStorageSupported = (): boolean =>
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
        request.error ?? new Error("Failed to open nylon fabric storage.")
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
        fail(req.error ?? new Error("Nylon fabric storage request failed."));
    }

    tx.oncomplete = done;
    tx.onabort = () =>
      fail(tx.error ?? new Error("Nylon fabric storage transaction aborted."));
    tx.onerror = () =>
      fail(tx.error ?? new Error("Nylon fabric storage transaction failed."));
  });
};

export const persistDesign = async (record: StoredDesign): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction("readwrite", (store) => store.put(record));
  return true;
};

export const loadDesigns = async (): Promise<StoredDesign[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<StoredDesign[]>("readonly", (store) =>
    store.getAll()
  );
  return Array.isArray(records)
    ? records.sort((a, b) => b.createdAt - a.createdAt)
    : [];
};

export const deleteDesign = async (designId: string): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.delete(designId));
};

export const clearDesigns = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.clear());
};
