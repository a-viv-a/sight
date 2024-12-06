import { createAsync } from "@solidjs/router"
import { JSX, ParentComponent, Show, Suspense } from "solid-js"
import { isServer } from "solid-js/web"

export const loadEvent = new Promise<true>((res) => {
  if (document.readyState === "complete") res(true)
  else window.addEventListener("load", () => res(true))
})

export const DeferRender: ParentComponent<{ fallback?: JSX.Element }> = props => {
  const loaded = createAsync(() => loadEvent)

  return <Suspense fallback={props.fallback}>
    <Show when={!isServer && loaded()} fallback={props.fallback}>
      {props.children}
    </Show>
  </Suspense>
}
