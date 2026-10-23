// A photo stays on this browser until the user explicitly starts processing.
// IndexedDB preserves the File across authentication and checkout redirects.
import type { Plan } from './pricing';
export type CustomDraft = { files: File[]; plan: Plan; savedAt: number; ownerId: string | null };
const KEY = 'custom-photo';
const draftKey = (ownerId?: string | null) => ownerId ? `${KEY}:account:${ownerId}` : `${KEY}:guest`;
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('deskbub-custom-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Your browser could not save this photo. Allow site storage and try again.'));
  });
}
async function access<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('drafts', mode);
      let value: T;
      action(transaction.objectStore('drafts'), result => { value = result; });
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = transaction.onerror = () => reject(new Error('Your photo could not be saved. Please try again.'));
    });
  } finally { db.close(); }
}
export async function saveCustomDraft(draft: CustomDraft) {
  await access<void>('readwrite', store => { store.put(draft, draftKey(draft.ownerId)); });
}
export async function clearCustomDraft(ownerId?: string) {
  await access<void>('readwrite', store => {
    store.delete(draftKey(ownerId));
    const legacy = store.get(KEY);
    legacy.onsuccess = () => {
      if (legacy.result && (legacy.result.ownerId || null) === (ownerId || null)) store.delete(KEY);
    };
  });
}
export async function loadCustomDraft(ownerId?: string): Promise<CustomDraft | null> {
  // Reading and claiming a guest/legacy draft share one transaction, so another
  // account cannot adopt the same guest photos during an overlapping login.
  return access<CustomDraft | null>('readwrite', (store, result) => {
    const target = draftKey(ownerId);
    const keys = [...new Set([target, KEY, ...(ownerId ? [draftKey()] : [])])];
    function read(index: number) {
      if (index === keys.length) { result(null); return; }
      const source = keys[index];
      const request = store.get(source);
      request.onsuccess = () => {
        const draft: CustomDraft | undefined = request.result;
        if (!draft || (draft.ownerId && draft.ownerId !== ownerId)) { read(index + 1); return; }
        if (!Number.isFinite(draft.savedAt) || Date.now() - draft.savedAt > 24 * 60 * 60 * 1000 ||
            !['basic', 'plus'].includes(draft.plan) || !Array.isArray(draft.files) ||
            !draft.files.length || draft.files.length > (draft.plan === 'basic' ? 1 : 5) ||
            !draft.files.every(file => file instanceof File)) {
          store.delete(source); read(index + 1); return;
        }
        const restored = { ...draft, ownerId: ownerId || null };
        if (source !== target) { store.put(restored, target); store.delete(source); }
        result(restored);
      };
    }
    read(0);
  });
}
