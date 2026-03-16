import { A } from "@solidjs/router";
import { Component, For, Show, createSignal, createEffect } from "solid-js";
import { manifest } from "~/photos/manifest";
import { getTopLevelCollections } from "~/photos/loader";
import type { CollectionData } from "~/photos/types";
import styles from "./CollectionBrowser.module.css";

const TreeNode: Component<{
  collection: CollectionData;
  currentPath: string;
  depth: number;
}> = (props) => {
  const isActive = () =>
    props.currentPath === props.collection.path ||
    props.currentPath.startsWith(props.collection.path + "/");

  const [expanded, setExpanded] = createSignal(isActive());

  createEffect(() => {
    if (isActive()) setExpanded(true);
  });

  const children = () =>
    props.collection.children
      .map((p) => manifest.collections[p])
      .filter((c): c is CollectionData => c != null)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const photos = () =>
    props.collection.photos
      .map((p) => manifest.photos[p])
      .filter(Boolean);

  const hasChildren = () =>
    props.collection.children.length > 0 || props.collection.photos.length > 0;

  return (
    <li class={styles.node}>
      <div
        class={styles.nodeHeader}
        style={{ "padding-inline-start": `${props.depth * 12}px` }}
      >
        <Show
          when={hasChildren()}
          fallback={<span class={styles.expandSpacer} />}
        >
          <button
            class={styles.expandBtn}
            classList={{ [styles.expanded]: expanded() }}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded() ? "Collapse" : "Expand"}
          >
            <svg viewBox="0 0 10 10" class={styles.chevron}>
              <path d="M3,2 L7,5 L3,8" />
            </svg>
          </button>
        </Show>
        <A
          href={`/photos/${props.collection.path}`}
          class={styles.nodeLink}
          classList={{
            [styles.active]: props.currentPath === props.collection.path,
          }}
        >
          {props.collection.title}
        </A>
      </div>
      <Show when={expanded()}>
        <ul class={styles.childList}>
          <For each={children()}>
            {(child) => (
              <TreeNode
                collection={child}
                currentPath={props.currentPath}
                depth={props.depth + 1}
              />
            )}
          </For>
          <For each={photos()}>
            {(photo) => (
              <li class={styles.node}>
                <div
                  class={styles.nodeHeader}
                  style={{
                    "padding-inline-start": `${(props.depth + 1) * 12}px`,
                  }}
                >
                  <span class={styles.expandSpacer} />
                  <A
                    href={`/photos/${photo.path}`}
                    class={styles.nodeLink}
                    classList={{
                      [styles.active]: props.currentPath === photo.path,
                    }}
                  >
                    {photo.title || photo.file}
                  </A>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </li>
  );
};

const CollectionBrowser: Component<{
  currentPath: string;
}> = (props) => {
  const topLevel = getTopLevelCollections();

  return (
    <nav class={styles.browser}>
      <A href="/photos" class={styles.root}>
        Photos
      </A>
      <ul class={styles.tree}>
        <For each={topLevel}>
          {(collection) => (
            <TreeNode
              collection={collection}
              currentPath={props.currentPath}
              depth={0}
            />
          )}
        </For>
      </ul>
    </nav>
  );
};

export default CollectionBrowser;
