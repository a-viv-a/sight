"use server"
import { json, redirect } from "@solidjs/router";
import { DEPTH, WIDTH } from "~/pixelConfig";
import { event } from "./util"

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
  // if (session.data.lastActionMS !== undefined && now - session.data.lastActionMS < env.ACTION_DELAY_MS) {
  //   return json({ error: `took action too recently`, remainingMs: now - session.data.lastActionMS } as const, {
  //     status: 429,
  //   })
  // }
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
