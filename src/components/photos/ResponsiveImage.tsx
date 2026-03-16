import { Component, Show } from "solid-js";
import type { PhotoData } from "~/photos/types";
import styles from "./ResponsiveImage.module.css";

const ResponsiveImage: Component<{
  photo: PhotoData;
  mode: "thumbnail" | "full";
  class?: string;
}> = (props) => {
  return (
    <div
      class={`${styles.wrapper} ${props.class ?? ""}`}
      style={{ "aspect-ratio": `${props.photo.width} / ${props.photo.height}` }}
    >
      <img
        class={styles.placeholder}
        src={props.photo.placeholder}
        alt=""
        aria-hidden="true"
      />
      <Show when={props.photo} keyed>
        {(photo) => (
          <picture>
            <source
              type="image/webp"
              srcset={`${photo.sizes.sm.url} ${photo.sizes.sm.width}w, ${photo.sizes.md.url} ${photo.sizes.md.width}w, ${photo.sizes.full.url} ${photo.sizes.full.width}w`}
              sizes={
                props.mode === "thumbnail"
                  ? "(max-width: 640px) 50vw, 200px"
                  : "(max-width: 1024px) 100vw, 100vw"
              }
            />
            <img
              class={styles.image}
              src={photo.sizes.md.url}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading={props.mode === "thumbnail" ? "lazy" : "eager"}
              decoding={props.mode === "thumbnail" ? "async" : "sync"}
            />
          </picture>
        )}
      </Show>
    </div>
  );
};

export default ResponsiveImage;
