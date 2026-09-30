/**
 * IndexedDB 持久化（无后端）：保存视场配置与目标批注。
 */
import { openDB, type IDBPDatabase } from 'idb';
import type { Annotation, SavedView } from '../types';

const DB_NAME = 'local-star-atlas';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('views')) d.createObjectStore('views', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('annotations')) d.createObjectStore('annotations', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function listViews(): Promise<SavedView[]> {
  return (await (await db()).getAll('views')) as SavedView[];
}

export async function putView(v: SavedView): Promise<void> {
  await (await db()).put('views', v);
}

export async function deleteView(id: string): Promise<void> {
  await (await db()).delete('views', id);
}

export async function listAnnotations(): Promise<Annotation[]> {
  return (await (await db()).getAll('annotations')) as Annotation[];
}

export async function putAnnotation(a: Annotation): Promise<void> {
  await (await db()).put('annotations', a);
}

export async function deleteAnnotation(id: string): Promise<void> {
  await (await db()).delete('annotations', id);
}
