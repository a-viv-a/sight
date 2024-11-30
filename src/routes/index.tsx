import { Title } from "@solidjs/meta";
import { Component, createSignal } from "solid-js";
import styles from "./index.module.css"
import DownArrow from "~/components/DownArrow";

const Email: Component<{ address: string }> = props =>
  <a class={styles.email} href={`mailto:${props.address}`} title={props.address}>{props.address}</a>

export default function Home() {
  const [sliding, setSliding] = createSignal(false);

  return (
    <main>
      <div class={styles.card}>
        <Title>Aviva Ruben</Title>
        <h1>Aviva Ruben</h1>
        <Email address="aviva@rubenfamily.com" />
        <DownArrow squish={sliding()} onClick={
          () => { setSliding(v => !v) }
        } />
      </div>
      <div class={styles.card}>
        hi
      </div>
    </main>
  );
}
