"use server"

import { action, json, query, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { DEPTH, WIDTH } from "./components/Pixel";
import { useSession } from "vinxi/http";

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

const useSecretSession = (env: Wenv) => useSession<{
  lastActionMS?: number
}>({
  password: env.SESSION_SECRET
})

export const getPaintings = query(async () => {
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
}, "getPaintings")

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
  const session = await useSecretSession(env)
  const now = Date.now()
  if (session.data.lastActionMS !== undefined && now - session.data.lastActionMS < env.ACTION_DELAY_MS) {
    return json({ error: `took action too recently`, remainingMs: now - session.data.lastActionMS } as const, {
      status: 429,
    })
  }
  const [result] = await Promise.all([
    env.DB.prepare(
      `INSERT INTO Paintings (data, author_ip) VALUES (?, ?)`
    ).bind(painting, ip)
      .run(),
    session.update(() => ({ lastActionMS: now }))
  ])

  if (!result.success) {
    console.error("addPainting failed", result)
    return json({ error: 'db error' } as const, { status: 500 })
  }

  if (["/", "/gallery"].includes(goto)) {
    return redirect(goto)
  }
  return json({ error: 'goto error' }, { status: 400 })
})
