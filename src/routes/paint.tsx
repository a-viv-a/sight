import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { batch, createSignal } from "solid-js";
import { Paint } from "~/components/Pixel";
import { addPainting } from "~/paintingServer";
import { useAction } from "@solidjs/router";

export default function PaintRoute() {
  const [data, setData] = createSignal(new Uint8Array(64))
  const [pending, setPending] = createSignal(false)

  const submit = useAction(addPainting);
  
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
      <Paint data={data} setData={setData} disabled={pending()} />
      <button class={styles.button} onClick={() => {
        batch(() => {
          submit(data()).then(() => {
            setPending(false)
          })
          setPending(true)
        })
      }} disabled={pending()}>
        Submit Painting
      </button>
    </main>
  );
}
