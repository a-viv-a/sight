import { Component, ParentComponent, Show } from "solid-js";

import styles from "./Toml.module.css"

// named to not conflict with comment inferface...
export const TComment: Component<{ children: string }> = props => <p class={`${styles.fullwidth} ${styles.comment}`}># {props.children}</p>

export const Group: ParentComponent<{ head: string }> = props =>
  <div class={styles.fullwidth}>
    <p class={styles.groupHead}>[{props.head}]</p>
    <div class={styles.groupBody}>
      {props.children}
    </div>
  </div>

export const KV: Component<{ key: string, val: string, link?: string }> = props =>
  <>
    <span class={styles.key}>{props.key}</span>
    <span class={styles.val}>={" "}
    <Show when={props.link} fallback={<span>"{props.val}"</span>}>{link =>
      <a href={link()} class={styles.val}>"{props.val}"</a>
    }</Show>
    </span>
  </>

export const File: ParentComponent = (props) => {
  return <code class={styles.file}><div>{props.children}</div></code>
}

export default {
  Comment: TComment,
  KV,
  Group,
  File,
}
