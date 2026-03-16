import { Component, Show } from "solid-js";
import type { PhotoData } from "~/photos/types";
import styles from "./PhotoMeta.module.css";

const PhotoMeta: Component<{
  photo: PhotoData;
  visible: boolean;
  onClose: () => void;
}> = (props) => {
  const e = () => props.photo.exif;

  return (
    <>
      <Show when={props.visible}>
        <div class={styles.backdrop} onClick={() => props.onClose()} />
      </Show>
      <div classList={{ [styles.meta]: true, [styles.visible]: props.visible }}>
      <h2 class={styles.title}>{props.photo.title || props.photo.file}</h2>
      <dl class={styles.details}>
        <Show when={e().camera}>
          {(v) => (
            <>
              <dt>Camera</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
        <Show when={e().lens}>
          {(v) => (
            <>
              <dt>Lens</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
        <Show when={e().focalLength}>
          {(v) => (
            <>
              <dt>Focal length</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
        <Show when={e().aperture}>
          {(v) => (
            <>
              <dt>Aperture</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
        <Show when={e().shutterSpeed}>
          {(v) => (
            <>
              <dt>Shutter</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
        <Show when={e().iso}>
          {(v) => (
            <>
              <dt>ISO</dt>
              <dd>{v()}</dd>
            </>
          )}
        </Show>
      </dl>
      <Show when={props.photo.process}>
        <p class={styles.process}>{props.photo.process}</p>
      </Show>
      </div>
    </>
  );
};

export default PhotoMeta;
