import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { createSignal } from "solid-js";
import { Paint } from "~/components/Pixel";

export default function PaintRoute() {
  const [data, setData] = createSignal(new Uint8Array(64))

  return (
    <main classList={{
      [styles.page]: true,
      [styles.padtop]: true
    }}>
      <Title>Paint</Title>
      <p>
        Leave your mark. Nothing I'll need to remove, please.
        Sort of like signing a guestbook.
        <br />
        No more than once a week?
      </p>
      <Paint data={data} setData={setData} />
      <button class={styles.button}>
        Submit Painting
      </button>
    </main>
  );
}
