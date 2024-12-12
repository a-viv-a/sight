import { Meta, Title } from "@solidjs/meta";
import { Component } from "solid-js";

const defaults = {
  title: "Aviva Ruben",
  description: "~"
} as const

type Params = Parameters<typeof Metadata>[0]
const read = (params: Params, key: keyof typeof params) => 
  params[key] ?? defaults[key]

const Og: Component<{
  params: Params,
  key: keyof Params
}> = props => <Meta
  property={`og:${props.key}`}
  content={read(props.params, props.key)}
/>

const Metadata: Component<{
  title?: string,
  description?: string
}> = props => <>
  <Title>{read(props, "title")}</Title>
  <Og key="title" params={props} />
  <Og key="description" params={props} />
</>
export default Metadata
