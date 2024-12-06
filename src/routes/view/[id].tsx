import { Title } from "@solidjs/meta";
import styles from "../index.module.css"
import { createAsync, redirect, useParams } from "@solidjs/router";
import { Render } from "~/components/Pixel";
import { getPainting } from "~/paintingServer";
import { createResource, Show } from "solid-js";

export default function ViewIdRoute() {
  const params = useParams<{id: string}>()
  const painting = createAsync(() => {
    const id = parseInt(params.id)
    if (isNaN(id) || id < 0) {
      throw redirect("/view/0")
    }
    return getPainting(id)
  })

  console.log(painting())
  
  return (
    <main classList={{ [styles.page]: true, [styles.padtop]: true }}>
      <Title>View {params.id}</Title>
      <Show fallback={<code>painting is null / undefined</code>} when={painting()}>{painting =>
        <Render data={painting()}/>
      }</Show>
    </main>
  );
}
