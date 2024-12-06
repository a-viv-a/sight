"use server"
import { json, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { useSession } from "vinxi/http";
import { DEPTH, WIDTH } from "~/pixelConfig";

const event = () => {
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

const useSecretSession = async (env: Wenv) => {
  const maxAgeMS = env.ACTION_DELAY_MS * 2
  return useSession<{
    lastActionMS?: number
  }>({
    password: typeof env.SESSION_SECRET === "string" && env.SESSION_SECRET.length > 0
      ? env.SESSION_SECRET
      : "placeholderpreviewsecret",
    maxAge: maxAgeMS / 1e3,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: maxAgeMS / 1e3,
      expires: new Date(Date.now() + maxAgeMS)
    }
  })
}
export const getPaintingsRPC = async () => {
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

export const addPaintingRPC = async (painting: Uint8Array, goto: string) => {
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
  // @ts-expect-error
  console.log(now - session.data.lastActionMS)
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
}
