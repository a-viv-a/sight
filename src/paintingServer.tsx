"use server";

import { action } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";

const env = (): Wenv => {
  const event = getRequestEvent()
  // fallback to process.env for local development
  const env = event?.nativeEvent.context.cloudflare.env
  if (env === undefined) {
    throw new Error("missing environment")
  }
  return env
}

export const getPaintings = async () => {
  const result = await env().DB.prepare(
    `SELECT data from Paintings ORDER BY id`
  ).all<{
    data: ArrayBuffer
  }>()
  if(!result.success) {
    console.error("getPaintings failed", result)
    return []
  }

  console.log(result.results)
  return result.results.map(v => new Uint8Array(v.data))
}

export const addPainting = action(async (painting: Uint8Array) => {
  // console.log({ painting })
  return true
  // const result = await env().DB.prepare(
  //   `INSERT INTO Paintings (data, author_ip) VALUES (?, ?)`
  // ).bind(painting, ":3")
  // .run()
  // console.log(result)

  // if(!result.success) console.error(result)

  // return result.success
})
