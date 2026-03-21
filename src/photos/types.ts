export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
}

export interface ImageSize {
  width: number;
  height: number;
  url: string;
  bytes: number;
}

export interface PhotoData {
  file: string;
  path: string;
  collection: string;
  title?: string;
  alt: string;
  aspectRatio: number;
  width: number;
  height: number;
  placeholder: string;
  process?: string;
  exif: ExifData;
  sizes: {
    full: ImageSize;
    md: ImageSize;
    sm: ImageSize;
  };
}

export interface CollectionData {
  title: string;
  slug: string;
  path: string;
  blurb: string;
  blurbHtml: string;
  covers: string[];
  license?: string;
  licenseUrl?: string;
  sortOrder: number;
  children: string[];
  photos: string[];
  parent: string | null;
}

export interface PhotoManifest {
  collections: Record<string, CollectionData>;
  photos: Record<string, PhotoData>;
  totalBytes: number;
}

export type ResolvedPath =
  | { type: "index" }
  | { type: "collection"; collection: CollectionData }
  | { type: "photo"; photo: PhotoData; collection: CollectionData };
