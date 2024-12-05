import { action, json, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { DEPTH, WIDTH } from "./components/Pixel";

// reasons i don't understand prevent file level use server from working...

const event = () => {
  "use server"
  const event = getRequestEvent()
  if (event === undefined) {
    throw new Error("missing event details")
  }
  const cf = event?.nativeEvent.context.cloudflare
  if (cf === undefined) {
    throw new Error("missing cloudflare event details")
  }
  if (event.request === undefined) {
    throw new Error("missing request details")
  }
  return { env: cf.env, ...event }
}

export const getPaintings = async () => {
  "use server"
  const { env } = event()
  const result = await env.DB.prepare(
    `SELECT data from Paintings ORDER BY id DESC`
  ).all<{
    data: ArrayBuffer
  }>()
  if (!result.success) {
    console.error("getPaintings failed", result)
    return []
  }

  // console.log(result.results)
  return result.results.map(v => new Uint8Array(v.data))
}

export const addPainting = action(async (painting: Uint8Array, goto: string) => {
  "use server"
  const { env, request } = event()
  const ip = request.headers.get('CF-Connecting-IP')
  if (ip === null) {
    console.error("missing ip address in headers...")
    console.error(request.headers)
    return json({ error: 'ip header error' } as const, { status: 500 })
  }
  if (
    painting.length !== Math.pow(WIDTH, 2)
    || !painting.every(c => c <= DEPTH)
  ) {
    return json({ error: "validation error" } as const, { status: 400 })
  }
  const result = await env.DB.prepare(
    `INSERT INTO Paintings (data, author_ip) VALUES (?, ?)`
  ).bind(painting, ip)
    .run()
  // console.log(result)

  if (!result.success) {
    console.error(result)
    return json({ error: 'db error' } as const, { status: 500 })
  }

  if (["/", "/gallery"].includes(goto)) {
    return redirect(goto)
  }
  return json({ error: 'goto error' }, { status: 400 })
})
