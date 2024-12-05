import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { batch, createSignal, Show } from "solid-js";
import { Paint } from "~/components/Pixel";
import { addPainting } from "~/paintingServer";
import { useAction, useSubmission } from "@solidjs/router";

export default function PaintRoute() {
  const [data, setData] = createSignal(new Uint8Array(64))

  const addPaintingAction = useAction(addPainting);
  const adding = useSubmission(addPainting)

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
      <Paint data={data} setData={setData} disabled={adding.pending} />
      <Show when={adding.result}>{(result) =>
        <code>error: {result().error}</code>
      }</Show>
      <button class={styles.button} onClick={() => {
        addPaintingAction(data())
      }} disabled={adding.pending}>
        Submit Painting
      </button>
    </main>
  );
}
