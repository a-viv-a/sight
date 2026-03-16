import { A, useNavigate } from "@solidjs/router";
import { Component, Show, createSignal, onMount, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import type { PhotoData, CollectionData } from "~/photos/types";
import ResponsiveImage from "./ResponsiveImage";
import PhotoMeta from "./PhotoMeta";
import LicenseInfo from "./LicenseInfo";
import styles from "./Lightbox.module.css";

const Lightbox: Component<{
  photo: PhotoData;
  collection: CollectionData;
  prev: PhotoData | null;
  next: PhotoData | null;
}> = (props) => {
  const navigate = useNavigate();
  const [showMeta, setShowMeta] = createSignal(false);

  if (!isServer) {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (props.prev) navigate(`/photos/${props.prev.path}`);
          break;
        case "ArrowRight":
          if (props.next) navigate(`/photos/${props.next.path}`);
          break;
        case "Escape":
          navigate(`/photos/${props.collection.path}`);
          break;
        case "i":
          setShowMeta((v) => !v);
          break;
      }
    };

    onMount(() => window.addEventListener("keydown", onKeyDown));
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  }

  let pointerStartX = 0;
  const SWIPE_THRESHOLD = 50;

  return (
    <div class={styles.lightbox}>
      <div
        class={styles.imageArea}
        onPointerDown={(e) => {
          pointerStartX = e.clientX;
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - pointerStartX;
          if (Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx > 0 && props.prev)
              navigate(`/photos/${props.prev.path}`);
            else if (dx < 0 && props.next)
              navigate(`/photos/${props.next.path}`);
          }
        }}
      >
        <ResponsiveImage photo={props.photo} mode="full" class={styles.image} />
      </div>

      <PhotoMeta photo={props.photo} visible={showMeta()} onClose={() => setShowMeta(false)} />

      <div class={styles.controls}>
        <div class={styles.navGroup}>
          <Show
            when={props.prev}
            fallback={
              <span class={`${styles.navBtn} ${styles.navBtnDisabled}`}>
                <svg viewBox="0 0 10 10" class={styles.arrow}>
                  <path d="M7,2 L3,5 L7,8" />
                </svg>
              </span>
            }
          >
            {(prev) => (
              <A href={`/photos/${prev().path}`} class={styles.navBtn}>
                <svg viewBox="0 0 10 10" class={styles.arrow}>
                  <path d="M7,2 L3,5 L7,8" />
                </svg>
              </A>
            )}
          </Show>
          <Show
            when={props.next}
            fallback={
              <span class={`${styles.navBtn} ${styles.navBtnDisabled}`}>
                <svg viewBox="0 0 10 10" class={styles.arrow}>
                  <path d="M3,2 L7,5 L3,8" />
                </svg>
              </span>
            }
          >
            {(next) => (
              <A href={`/photos/${next().path}`} class={styles.navBtn}>
                <svg viewBox="0 0 10 10" class={styles.arrow}>
                  <path d="M3,2 L7,5 L3,8" />
                </svg>
              </A>
            )}
          </Show>
        </div>

        <div class={styles.infoGroup}>
          <LicenseInfo collection={props.collection} />
          <button
            class={styles.infoBtn}
            classList={{ [styles.infoBtnActive]: showMeta() }}
            onClick={() => setShowMeta((v) => !v)}
            aria-label="Toggle photo details"
          >
            i
          </button>
        </div>
      </div>

      <Show when={props.next}>
        {(next) => (
          <link rel="preload" as="image" href={next().sizes.full.url} />
        )}
      </Show>
    </div>
  );
};

export default Lightbox;
