import { manifest } from "./manifest";
import type { ResolvedPath, CollectionData, PhotoData } from "./types";

export function lookupPath(path: string): ResolvedPath | null {
  if (!path || path === "") {
    return { type: "index" };
  }

  const collection = manifest.collections[path];
  if (collection) {
    return { type: "collection", collection };
  }

  const photo = manifest.photos[path];
  if (photo) {
    const col = manifest.collections[photo.collection];
    if (!col) return null;
    return { type: "photo", photo, collection: col };
  }

  return null;
}

export function getTopLevelCollections(): CollectionData[] {
  return Object.values(manifest.collections)
    .filter(c => c.parent === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getChildren(collectionPath: string): CollectionData[] {
  const collection = manifest.collections[collectionPath];
  if (!collection) return [];
  return collection.children
    .map(p => manifest.collections[p])
    .filter((c): c is CollectionData => c != null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPhotos(collectionPath: string): PhotoData[] {
  const collection = manifest.collections[collectionPath];
  if (!collection) return [];
  const photos: PhotoData[] = [];
  for (const p of collection.photos) {
    const photo = manifest.photos[p];
    if (photo) photos.push(photo);
  }
  return photos;
}

export function getAdjacentPhotos(photoPath: string): {
  prev: PhotoData | null;
  next: PhotoData | null;
} {
  const photo = manifest.photos[photoPath];
  if (!photo) return { prev: null, next: null };

  const siblings = manifest.collections[photo.collection]?.photos ?? [];
  const idx = siblings.indexOf(photoPath);

  return {
    prev: idx > 0 ? manifest.photos[siblings[idx - 1]] ?? null : null,
    next: idx < siblings.length - 1 ? manifest.photos[siblings[idx + 1]] ?? null : null,
  };
}

export function buildBreadcrumbs(path: string): CollectionData[] {
  const crumbs: CollectionData[] = [];
  let current: string | null = path;

  if (manifest.photos[path]) {
    current = manifest.photos[path].collection;
  }

  while (current) {
    const col: CollectionData | undefined = manifest.collections[current];
    if (!col) break;
    crumbs.unshift(col);
    current = col.parent;
  }

  return crumbs;
}

export function countPhotosRecursive(collectionPath: string): number {
  const collection = manifest.collections[collectionPath];
  if (!collection) return 0;
  let count = collection.photos.length;
  for (const childPath of collection.children) {
    count += countPhotosRecursive(childPath);
  }
  return count;
}

export function getCollectionTotalBytes(collectionPath: string): number {
  const collection = manifest.collections[collectionPath];
  if (!collection) return 0;

  let total = 0;
  for (const photoPath of collection.photos) {
    const photo = manifest.photos[photoPath];
    if (photo) total += photo.sizes.full.bytes;
  }
  for (const childPath of collection.children) {
    total += getCollectionTotalBytes(childPath);
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
