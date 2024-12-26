import { Link, Meta, Title } from "@solidjs/meta";
import { Component, Show } from "solid-js";

const defaults = {
  title: "Aviva Ruben",
  description: "~"
} as const

type Params = Parameters<typeof Metadata>[0]
const read = (params: Params, key: keyof typeof defaults) => 
  params[key] ?? defaults[key]

const Og: Component<{
  params: Params,
  key: keyof typeof defaults
}> = props => <Meta
  property={`og:${props.key}`}
  content={read(props.params, props.key)}
/>

// always secure...
type Url = `https://aviva.gay${string}`

const Metadata: Component<{
  title?: string,
  description?: string,
  canonical?: Url,
}> = props => <>
  <Title>{read(props, "title")}</Title>
  <Og key="title" params={props} />
  <Og key="description" params={props} />
  <Show when={props.description}>{description =>
    <Meta name="description" content={description()} />
  }</Show>
  <Show when={props.canonical}>{href =>
    <Link rel="canonical" href={href()}/>
  }</Show>
</>
export default Metadata
 
