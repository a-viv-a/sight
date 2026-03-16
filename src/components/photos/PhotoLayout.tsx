import { Component, JSX, Show, createSignal } from "solid-js";
import CollectionBrowser from "./CollectionBrowser";
import styles from "./PhotoLayout.module.css";

const PhotoLayout: Component<{
  currentPath: string;
  children: JSX.Element;
}> = (props) => {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  return (
    <div class={styles.layout}>
      <button
        class={styles.menuBtn}
        classList={{ [styles.menuBtnOpen]: sidebarOpen() }}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 10 10" class={styles.menuIcon}>
          <Show
            when={!sidebarOpen()}
            fallback={<path d="M2,2 L8,8 M8,2 L2,8" />}
          >
            <path d="M1,2.5 L9,2.5 M1,5 L9,5 M1,7.5 L9,7.5" />
          </Show>
        </svg>
      </button>

      <aside
        class={styles.sidebar}
        classList={{ [styles.sidebarOpen]: sidebarOpen() }}
      >
        <CollectionBrowser currentPath={props.currentPath} />
      </aside>

      <Show when={sidebarOpen()}>
        <div
          class={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      </Show>

      <main class={styles.main}>{props.children}</main>
    </div>
  );
};

export default PhotoLayout;
