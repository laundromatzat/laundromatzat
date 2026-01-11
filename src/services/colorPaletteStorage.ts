const DB_NAME = "laundromatzat-color-palette";
const STORE_NAME = "palettes";
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

export type ExtractedColor = {
  hex: string;
  rgb: [number, number, number];
};

export type StoredPalette = {
  id: string;
  fileName: string;
  createdAt: number;
  imageBlob: Blob;
  palette: ExtractedColor[];
};

export const isColorPaletteStorageSupported = (): boolean =>
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
        request.error ?? new Error("Failed to open color palette storage.")
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
        fail(req.error ?? new Error("Color palette storage request failed."));
    }

    tx.oncomplete = done;
    tx.onabort = () =>
      fail(tx.error ?? new Error("Color palette storage transaction aborted."));
    tx.onerror = () =>
      fail(tx.error ?? new Error("Color palette storage transaction failed."));
  });
};

export const persistPalette = async (
  record: StoredPalette
): Promise<boolean> => {
  if (!indexedDBFactory) return false;
  await runTransaction("readwrite", (store) => store.put(record));
  return true;
};

export const loadPalettes = async (): Promise<StoredPalette[]> => {
  if (!indexedDBFactory) return [];
  const records = await runTransaction<StoredPalette[]>("readonly", (store) =>
    store.getAll()
  );
  return Array.isArray(records)
    ? records.sort((a, b) => b.createdAt - a.createdAt)
    : [];
};

export const deletePalette = async (paletteId: string): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.delete(paletteId));
};

export const clearPalettes = async (): Promise<void> => {
  if (!indexedDBFactory) return;
  await runTransaction("readwrite", (store) => store.clear());
};
