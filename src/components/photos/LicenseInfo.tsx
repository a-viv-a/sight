import { Component, Show } from "solid-js";
import type { CollectionData } from "~/photos/types";
import styles from "./LicenseInfo.module.css";

const LicenseInfo: Component<{
  collection: CollectionData;
}> = (props) => {
  return (
    <Show when={props.collection.license}>
      {(license) => (
        <span class={styles.license}>
          <Show
            when={props.collection.licenseUrl}
            fallback={license()}
          >
            {(url) => (
              <a href={url()} target="_blank" rel="noopener noreferrer">
                {license()}
              </a>
            )}
          </Show>
        </span>
      )}
    </Show>
  );
};

export default LicenseInfo;
