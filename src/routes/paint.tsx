import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { createSignal } from "solid-js";
import { Paint } from "~/components/Pixel";

export default function PaintRoute() {
  const [data, setData] = createSignal([new Uint8Array(64) as Uint8Array])
  
  return (
    <main class={styles.page}>
      <Title>Paint</Title>
      <Paint data={data} setData={setData} />
    </main>
  );
}
