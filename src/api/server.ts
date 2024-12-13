"use server"
import { json, redirect } from "@solidjs/router";
import { DEPTH, WIDTH } from "~/pixelConfig";
import { IS_DEVELOPMENT } from "~/mode";
import { useEvent } from "./serverUtils";
import { d1backing, ratelimit, restrictiveRatelimit } from "./ratelimit";

export const getPaintingsRPC = async () => {
  const { env } = await useEvent()
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
  const arrivedAt = Date.now()
  const { env, request } = await useEvent()
  const ip = IS_DEVELOPMENT ? "localhost" : request.headers.get('CF-Connecting-IP')
  if (ip === null) {
    console.error("missing ip address in headers...")
    console.error(request.headers)
    return json({ error: 'ip header error' } as const, { status: 500 })
  }

  const status = await ratelimit(
    `addpaintings/${ip}`,
    arrivedAt,
    restrictiveRatelimit,
    d1backing(env)
  )
  if (!status.accept) {
    return json({ error: `ip ratelimiting`, remainingSeconds: status.retryAfter } as const, {
      status: 429,
      headers: {
        "Retry-After": status.retryAfter.toString()
      }
    })
  }

  if (
    painting.length !== Math.pow(WIDTH, 2)
    || !painting.every(c => c <= DEPTH)
  ) {
    return json({ error: "validation error" } as const, { status: 400 })
  }

  const result = await env.DB.prepare(
    `INSERT INTO Paintings (data, author_ip) VALUES (?, ?)`
  ).bind(painting, ip).run()


  if (!result.success) {
    console.error("addPainting failed", result)
    return json({ error: 'db error' } as const, { status: 500 })
  }

  if (["/", "/gallery"].includes(goto)) {
    return redirect(goto)
  }
  return json({ error: 'goto error' }, { status: 400 })
} 
