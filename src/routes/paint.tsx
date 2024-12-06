import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { batch, createSignal, onMount, Show } from "solid-js";
import { Paint } from "~/components/Pixel";
import { useAction, useSearchParams, useSubmission } from "@solidjs/router";
import { addPainting } from "~/api";

export default function PaintRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [goto, setGoto] = createSignal("/gallery")

  onMount(() => {
    const gotoParam = searchParams.goto
    if (gotoParam !== undefined && typeof gotoParam == "string") {
      batch(() => {
        setGoto(gotoParam)
        setSearchParams({
          goto: null
        })
      })
    }
  })

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
        addPaintingAction(data(), goto())
      }} disabled={adding.pending}>
        Submit Painting
      </button>
    </main>
  );
}
