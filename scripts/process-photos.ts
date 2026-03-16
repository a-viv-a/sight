import { readdir, readFile, mkdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import matter from "gray-matter";
import { marked } from "marked";
import type {
  PhotoManifest,
  CollectionData,
  PhotoData,
  ExifData,
  ImageSize,
} from "../src/photos/types.ts";

const SIZES = [
  { name: "full", maxDimension: null },
  { name: "1200", maxDimension: 1200 },
  { name: "640", maxDimension: 640 },
] as const;

const WEBP_QUALITY = 85;
const PLACEHOLDER_WIDTH = 32;
const CONTENT_DIR = join(import.meta.dirname!, "..", "content", "photos");
const PUBLIC_DIR = join(import.meta.dirname!, "..", "public", "photos");
const MANIFEST_PATH = join(
  import.meta.dirname!,
  "..",
  "src",
  "photos",
  "manifest.ts"
);
const DEFAULT_SOURCE_ROOT = "/run/media/aviva/shroom/photography";

const LENS_NAMES: Record<number, string> = {
  154: "Nikon AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR",
};

interface PhotoEntry {
  file: string;
  source: string;
  title?: string;
  alt: string;
  process?: string;
}

interface CollectionFrontmatter {
  title: string;
  slug: string;
  cover?: string;
  license?: string;
  licenseUrl?: string;
  sortOrder?: number;
  photos?: PhotoEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlainText(tokens: any[]): string {
  return tokens
    .filter((t) => t.type !== "html")
    .map((t) => (t.tokens ? toPlainText(t.tokens) : t.text || ""))
    .join("");
}

function formatShutterSpeed(t: number): string {
  if (t >= 1) return `${t}s`;
  return `1/${Math.round(1 / t)}`;
}

function parseRational(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const parts = value.split("/");
  if (parts.length === 2) {
    const result = Number(parts[0]) / Number(parts[1]);
    if (Number.isFinite(result)) return result;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function extractExif(sourcePath: string): Promise<ExifData> {
  try {
    const data = await exifr.parse(sourcePath, {
      xmp: true,
      tiff: true,
      exif: true,
      chunked: false,
    } as Parameters<typeof exifr.parse>[1]);
    if (!data) return {};

    const make = data.Make;
    const model = data.Model;
    const camera = model ? `${make ?? ""} ${model}`.trim() : undefined;

    let lens: string | undefined =
      data.LensModel ?? undefined;
    if (!lens && data.LensProfileName) {
      const match = data.LensProfileName.match(/\((.+)\)/);
      if (match) lens = match[1];
    }
    if (!lens && typeof data.LensID === "number") {
      lens = LENS_NAMES[data.LensID];
    }
    if (!lens) lens = data.Lens ?? undefined;

    const focalLength = parseRational(data.FocalLength);
    const fNumber = parseRational(data.FNumber);
    const exposureTime = parseRational(data.ExposureTime);
    const iso = data.ISO ?? data.ISOSpeedRatings ?? undefined;

    return {
      camera,
      lens,
      focalLength: focalLength ? `${focalLength}mm` : undefined,
      aperture: fNumber ? `f/${fNumber}` : undefined,
      shutterSpeed: exposureTime
        ? formatShutterSpeed(exposureTime)
        : undefined,
      iso,
    };
  } catch {
    console.warn(`  warning: could not extract EXIF from ${sourcePath}`);
    return {};
  }
}

async function processImage(
  sourcePath: string,
  outputDir: string,
  force: boolean
): Promise<{
  placeholder: string;
  width: number;
  height: number;
  aspectRatio: number;
  sizes: { full: ImageSize; md: ImageSize; sm: ImageSize };
}> {
  await mkdir(outputDir, { recursive: true });

  const image = sharp(sourcePath, { failOn: "none" });
  const metadata = await image.metadata();
  const origWidth = metadata.width!;
  const origHeight = metadata.height!;

  const sizes: Record<string, ImageSize> = {};

  for (const size of SIZES) {
    const filename = size.maxDimension
      ? `${size.maxDimension}.webp`
      : "full.webp";
    const outputPath = join(outputDir, filename);

    const exists = !force && (await stat(outputPath).catch(() => null));
    if (exists) {
      const fileBytes = (await stat(outputPath)).size;
      const resized = size.maxDimension
        ? computeDimensions(origWidth, origHeight, size.maxDimension)
        : { width: origWidth, height: origHeight };
      const key = size.name === "full" ? "full" : size.name === "1200" ? "md" : "sm";
      sizes[key] = {
        width: resized.width,
        height: resized.height,
        url: `/photos/${relative(PUBLIC_DIR, outputPath)}`,
        bytes: fileBytes,
      };
      console.log(`  skip ${filename} (exists)`);
      continue;
    }

    let pipeline = image.clone();
    if (size.maxDimension) {
      pipeline = pipeline.resize({
        width:
          origWidth > origHeight ? size.maxDimension : undefined,
        height:
          origWidth <= origHeight ? size.maxDimension : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const buffer = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toBuffer();

    await writeFile(outputPath, buffer);
    const info = await sharp(buffer).metadata();

    const key = size.name === "full" ? "full" : size.name === "1200" ? "md" : "sm";
    sizes[key] = {
      width: info.width!,
      height: info.height!,
      url: `/photos/${relative(PUBLIC_DIR, outputPath)}`,
      bytes: buffer.byteLength,
    };
    console.log(
      `  wrote ${filename} (${info.width}x${info.height}, ${formatFileSize(buffer.byteLength)})`
    );
  }

  const placeholderBuffer = await image
    .clone()
    .resize({ width: PLACEHOLDER_WIDTH, fit: "inside" })
    .webp({ quality: 20 })
    .toBuffer();

  return {
    placeholder: `data:image/webp;base64,${placeholderBuffer.toString("base64")}`,
    width: origWidth,
    height: origHeight,
    aspectRatio: origWidth / origHeight,
    sizes: sizes as { full: ImageSize; md: ImageSize; sm: ImageSize },
  };
}

function computeDimensions(
  w: number,
  h: number,
  maxDim: number
): { width: number; height: number } {
  if (w >= h) {
    const targetW = Math.min(w, maxDim);
    return { width: targetW, height: Math.round((targetW / w) * h) };
  }
  const targetH = Math.min(h, maxDim);
  return { width: Math.round((targetH / h) * w), height: targetH };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function findCollections(
  dir: string,
  parentPath: string | null
): Promise<{
  collections: Record<string, CollectionData>;
  photoEntries: Array<{
    entry: PhotoEntry;
    collectionPath: string;
    contentDir: string;
  }>;
}> {
  const collections: Record<string, CollectionData> = {};
  const photoEntries: Array<{
    entry: PhotoEntry;
    collectionPath: string;
    contentDir: string;
  }> = [];

  const children: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  const mdPath = join(dir, "collection.md");
  const mdExists = await stat(mdPath).catch(() => null);

  const rawSlug = mdExists
    ? (matter(await readFile(mdPath, "utf-8")).data as CollectionFrontmatter).slug
    : null;
  const slug = rawSlug != null ? String(rawSlug) : null;
  const path = slug
    ? parentPath ? `${parentPath}/${slug}` : slug
    : parentPath;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const childResult = await findCollections(join(dir, entry.name), path);
    Object.assign(collections, childResult.collections);
    photoEntries.push(...childResult.photoEntries);
    for (const childPath of Object.keys(childResult.collections)) {
      if (childResult.collections[childPath].parent === path) {
        children.push(childPath);
      }
    }
  }

  if (!mdExists || !slug || !path) return { collections, photoEntries };

  const raw = await readFile(mdPath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as CollectionFrontmatter;

  if (!fm.title) {
    console.error(`missing required 'title' in ${mdPath}`);
    process.exit(1);
  }

  const photos = (fm.photos ?? []).map((p) => ({ ...p, file: String(p.file) }));
  const photoRefs = photos.map((p) => `${path}/${p.file}`);

  for (const entry of photos) {
    photoEntries.push({ entry, collectionPath: path, contentDir: dir });
  }

  collections[path] = {
    title: fm.title,
    slug,
    path,
    blurb: content.trim() ? toPlainText(marked.lexer(content.trim())) : "",
    blurbHtml: content.trim() ? (marked.parse(content.trim()) as string) : "",
    cover: fm.cover ? `${path}/${fm.cover}` : photoRefs[0],
    license: fm.license,
    licenseUrl: fm.licenseUrl,
    sortOrder: fm.sortOrder ?? 0,
    children,
    photos: photoRefs,
    parent: parentPath,
  };

  return { collections, photoEntries };
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp", ".avif", ".dng", ".cr2", ".nef", ".arw",
]);

async function initCollection(
  imageDir: string,
  slug: string,
  title: string,
  parent: string | null,
  sourceRoot: string
) {
  const contentPath = parent ? join(CONTENT_DIR, parent, slug) : join(CONTENT_DIR, slug);
  const mdPath = join(contentPath, "collection.md");

  const exists = await stat(mdPath).catch(() => null);
  if (exists) {
    console.error(`collection already exists: ${mdPath}`);
    process.exit(1);
  }

  const entries = await readdir(imageDir);
  const images = entries
    .filter((f) => IMAGE_EXTENSIONS.has(f.slice(f.lastIndexOf(".")).toLowerCase()))
    .sort();

  if (images.length === 0) {
    console.error(`no image files found in ${imageDir}`);
    process.exit(1);
  }

  const relativeDir = relative(sourceRoot, imageDir);

  const photoLines = images.map((filename, i) => {
    const num = String(i + 1).padStart(2, "0");
    const sourcePath = join(relativeDir, filename);
    return [
      `  - file: "${num}"`,
      `    source: "${sourcePath}"`,
      `    title: ""`,
      `    alt: ""`,
    ].join("\n");
  });

  const md = [
    "---",
    `title: "${title}"`,
    `slug: ${slug}`,
    `cover: "01"`,
    `license: "CC BY-NC-SA 4.0"`,
    `licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/"`,
    `sortOrder: 0`,
    `photos:`,
    photoLines.join("\n"),
    "---",
    "",
    "",
  ].join("\n");

  await mkdir(contentPath, { recursive: true });
  await writeFile(mdPath, md, "utf-8");
  console.log(`created ${mdPath} with ${images.length} photo entries`);
  console.log("edit the file to fill in titles, alt text, and blurb");
}

async function processAll(sourceDir: string, force: boolean) {
  const contentExists = await stat(CONTENT_DIR).catch(() => null);
  if (!contentExists) {
    console.error(`content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  console.log(`scanning ${CONTENT_DIR}...`);
  const { collections, photoEntries } = await findCollections(
    CONTENT_DIR,
    null
  );

  console.log(
    `found ${Object.keys(collections).length} collections, ${photoEntries.length} photos`
  );

  const CONCURRENCY = 4;

  const jobs = photoEntries.map(({ entry, collectionPath }) => ({
    photoPath: `${collectionPath}/${entry.file}`,
    sourcePath: join(sourceDir, entry.source),
    entry,
    collectionPath,
  }));

  for (const job of jobs) {
    const sourceExists = await stat(job.sourcePath).catch(() => null);
    if (!sourceExists) {
      console.error(`source not found: ${job.sourcePath} (for ${job.photoPath})`);
      process.exit(1);
    }
  }

  const photos: Record<string, PhotoData> = {};
  let totalBytes = 0;

  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (job) => {
        console.log(`processing ${job.photoPath}...`);
        const outputDir = join(PUBLIC_DIR, ...job.photoPath.split("/"));
        const [exif, result] = await Promise.all([
          extractExif(job.sourcePath),
          processImage(job.sourcePath, outputDir, force),
        ]);
        return { job, exif, result };
      })
    );

    for (const { job, exif, result } of results) {
      photos[job.photoPath] = {
        file: job.entry.file,
        path: job.photoPath,
        collection: job.collectionPath,
        title: job.entry.title,
        alt: job.entry.alt,
        process: job.entry.process,
        aspectRatio: result.aspectRatio,
        width: result.width,
        height: result.height,
        placeholder: result.placeholder,
        exif,
        sizes: result.sizes,
      };
      totalBytes += result.sizes.full.bytes;
    }
  }

  const manifest: PhotoManifest = { collections, photos, totalBytes };

  const manifestSource = [
    "// Auto-generated by scripts/process-photos.ts \u2014 do not edit manually.",
    '// Run `just photos <source-dir>` to regenerate.',
    'import type { PhotoManifest } from "./types";',
    "",
    `export const manifest: PhotoManifest = ${JSON.stringify(manifest, null, 2)};`,
    "",
  ].join("\n");

  await writeFile(MANIFEST_PATH, manifestSource, "utf-8");
  console.log(`\nwrote manifest to ${MANIFEST_PATH}`);
  console.log(
    `total: ${Object.keys(photos).length} photos, ${formatFileSize(totalBytes)}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (subcommand === "init") {
    const imageDir = args[1];
    const slug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
    const title = args.find((a) => a.startsWith("--title="))?.split("=")[1];
    const parent = args.find((a) => a.startsWith("--parent="))?.split("=")[1] ?? null;
    const sourceRoot = args.find((a) => a.startsWith("--source-root="))?.split("=")[1] ?? DEFAULT_SOURCE_ROOT;

    if (!imageDir || !slug || !title) {
      console.error(
        'usage: npx tsx scripts/process-photos.ts init <image-dir> --slug=name --title="Title" [--parent=176] [--source-root=/path]'
      );
      process.exit(1);
    }

    await initCollection(imageDir, slug, title, parent, sourceRoot);
  } else {
    const force = args.includes("--force");
    const sourceDir = args.find((a) => !a.startsWith("--")) ?? DEFAULT_SOURCE_ROOT;

    await processAll(sourceDir, force);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
