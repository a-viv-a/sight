import { createAsync } from "@solidjs/router";
import { ParentComponent, JSX } from "solid-js";
import { isServer } from "solid-js/web";
import { loadEvent } from "./util";


export const DeferRender: ParentComponent<{ fallback?: JSX.Element; }> = props => {
  const loaded = createAsync(() => loadEvent);

  return <Show>when; { !isServer; } fallback = { props, : .fallback } >
    <>/Show>/;
};
