import styles from "./index.module.css"
import { batch, createSignal, onMount, Show } from "solid-js";
import { Paint } from "~/components/Pixel";
import { useAction, useSearchParams, useSubmission } from "@solidjs/router";
import { addPainting } from "~/api";
import Metadata from "~/components/Metadata";
import { PALETTE } from "~/pixelConfig";
import { narrow, useRandom } from "~/utils";


export default function PaintRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [goto, setGoto] = createSignal("/gallery")

  const random = useRandom()

  const randomColorExcluding = (exclude: number) => {
    const choices = Array.from({ length: PALETTE.length }, (_, i) => i)
      .filter(n => n !== exclude)

    return choices[random(choices.length - 1)]
  }

  const color = random(PALETTE.length - 1)
  const backgroundColor = randomColorExcluding(color)

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

  const [data, setData] = createSignal(new Uint8Array(64).fill(
    backgroundColor
  ))

  const addPaintingAction = useAction(addPainting);
  const adding = useSubmission(addPainting)

  return (
    <main classList={{
      [styles.page]: true,
      [styles.padtop]: true
    }}>
      <Metadata
        title="Paint"
        description="Create pixel art to leave your permanent mark on my website. Like a guestbook!"
      />
      <p>
        Leave your mark. Nothing I'll need to remove, please.
        Sort of like signing a guestbook.
        <br />
        No more than once a week?
      </p>
      <Paint data={data} setData={setData} disabled={adding.pending} default={{
        color,
        backgroundColor
      }} />
      <Show when={adding.result}>{(result) =>
        <>
          <code>error: {result().error}</code>
          <Show when={narrow(result, r => "remainingSeconds" in r)}>{result =>
            <p>You shouldn't retry before {new Intl.DateTimeFormat(undefined, {
              timeStyle: "long"
            }).format(new Date(Date.now() + result().remainingSeconds * 1e3))}.
              If you think this is probably a mistake, please <a href="/">reach out!</a>
            </p>
          }</Show>
        </>
      }</Show>
      <button class={styles.button} onClick={() => {
        addPaintingAction(data(), goto())
      }} disabled={adding.pending}>
        Submit Painting
      </button>
    </main>
  );
}
