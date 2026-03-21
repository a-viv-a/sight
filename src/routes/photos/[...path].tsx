import { A, useParams } from "@solidjs/router";
import { For, Match, Show, Switch } from "solid-js";
import { HttpStatusCode } from "@solidjs/start";
import Metadata from "~/components/Metadata";
import PhotoLayout from "~/components/photos/PhotoLayout";
import Lightbox from "~/components/photos/Lightbox";
import ResponsiveImage from "~/components/photos/ResponsiveImage";
import LicenseInfo from "~/components/photos/LicenseInfo";
import {
  lookupPath,
  getTopLevelCollections,
  getChildren,
  getAdjacentPhotos,
  countPhotosRecursive,
  getCollectionTotalBytes,
  formatBytes,
} from "~/photos/loader";
import { manifest } from "~/photos/manifest";
import type { CollectionData } from "~/photos/types";
import styles from "./photos.module.css";

function CollectionCard(props: { collection: CollectionData }) {
  const coverPhoto = () =>
    props.collection.cover
      ? manifest.photos[props.collection.cover]
      : undefined;
  const totalBytes = () => getCollectionTotalBytes(props.collection.path);
  const photoCount = () => countPhotosRecursive(props.collection.path);

  return (
    <A href={`/photos/${props.collection.path}`} class={styles.card}>
      <Show when={coverPhoto()}>
        {(photo) => (
          <div class={styles.cardImage}>
            <ResponsiveImage photo={photo()} mode="thumbnail" />
          </div>
        )}
      </Show>
      <div class={styles.cardInfo}>
        <h2 class={styles.cardTitle}>{props.collection.title}</h2>
        <Show when={props.collection.blurb}>
          <p class={styles.cardBlurb}>{props.collection.blurb}</p>
        </Show>
        <span class={styles.cardMeta}>
          {photoCount()} photos · {formatBytes(totalBytes())}
        </span>
      </div>
    </A>
  );
}

function CollectionView(props: { collection: CollectionData }) {
  const children = () => getChildren(props.collection.path);
  const coverPhoto = () =>
    props.collection.cover
      ? manifest.photos[props.collection.cover]
      : undefined;
  const firstPhoto = () => {
    const first = props.collection.photos[0];
    return first ? manifest.photos[first] : undefined;
  };

  return (
    <div class={styles.collectionView} data-page={children().length > 0 ? "index" : undefined}>
      <Metadata
        title={props.collection.title}
        description={props.collection.blurb.slice(0, 200) || undefined}
        canonical={`https://aviva.gay/photos/${props.collection.path}`}
        image={coverPhoto()?.sizes.md.url}
        themeColor="#1a1a1a"
      />

      <div class={styles.collectionHero}>
        <Show when={coverPhoto()}>
          {(cover) => (
            <A
              href={`/photos/${(firstPhoto() ?? cover()).path}`}
              class={styles.coverLink}
            >
              <ResponsiveImage photo={cover()} mode="thumbnail" />
            </A>
          )}
        </Show>

        <div class={styles.collectionInfo}>
          <h1>{props.collection.title}</h1>
          <div class={styles.collectionMeta}>
            <LicenseInfo collection={props.collection} />
            <span class={styles.sizeInfo}>
              {countPhotosRecursive(props.collection.path)} photos · {formatBytes(getCollectionTotalBytes(props.collection.path))}
            </span>
          </div>
          <Show when={props.collection.blurbHtml}>
            <div class={styles.blurb} innerHTML={props.collection.blurbHtml} />
          </Show>
          <Show when={firstPhoto()}>
            {(photo) => (
              <A href={`/photos/${photo().path}`} class={styles.startLink}>
                View collection →
              </A>
            )}
          </Show>
        </div>
      </div>

      <Show when={children().length > 0}>
        <section class={styles.subcollections}>
          <For each={children()}>
            {(child) => <CollectionCard collection={child} />}
          </For>
        </section>
      </Show>
    </div>
  );
}

export default function PhotosRoute() {
  const params = useParams();
  const currentPath = () => String(params.path || "");
  const resolved = () => lookupPath(currentPath());
  const asCollection = () => {
    const r = resolved();
    return r?.type === "collection" ? r : undefined;
  };
  const asPhoto = () => {
    const r = resolved();
    return r?.type === "photo" ? r : undefined;
  };

  return (
    <PhotoLayout currentPath={currentPath()}>
      <Switch
        fallback={
          <>
            <HttpStatusCode code={404} />
            <div class={styles.notFound}>
              <h1>not found</h1>
              <p>
                <A href="/photos">back to photos</A>
              </p>
            </div>
          </>
        }
      >
        <Match when={resolved()?.type === "index"}>
          <Metadata
            title="Photos"
            description="Photography by Aviva Ruben"
            canonical="https://aviva.gay/photos"
            themeColor="#1a1a1a"
          />
          <div class={styles.index} data-page="index">
            <h1>Photos</h1>
            <section class={styles.subcollections}>
              <For each={getTopLevelCollections()}>
                {(collection) => <CollectionCard collection={collection} />}
              </For>
            </section>
          </div>
        </Match>

        <Match when={asCollection()}>
          {(r) => <CollectionView collection={r().collection} />}
        </Match>

        <Match when={asPhoto()}>
          {(r) => {
            const adj = () => getAdjacentPhotos(r().photo.path);
            return (
              <>
                <Metadata
                  title={`${r().photo.title || r().photo.file} — ${r().collection.title}`}
                  description={r().photo.alt}
                  canonical={`https://aviva.gay/photos/${r().photo.path}`}
                  image={r().photo.sizes.md.url}
                  themeColor="#1a1a1a"
                />
                <Lightbox
                  photo={r().photo}
                  collection={r().collection}
                  prev={adj().prev}
                  next={adj().next}
                />
              </>
            );
          }}
        </Match>
      </Switch>
    </PhotoLayout>
  );
}
