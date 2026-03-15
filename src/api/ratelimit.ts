import { clamp } from "../utils"

const IPV6_GROUPS = 8
const IPV6_PREFIX_GROUPS = 4 // /64

function expandIPv6(ip: string): string[] {
  const halves = ip.split('::')
  let groups: string[]

  if (halves.length === 2) {
    const left = halves[0] ? halves[0].split(':') : []
    const right = halves[1] ? halves[1].split(':') : []
    const fill = IPV6_GROUPS - left.length - right.length
    groups = [...left, ...Array<string>(fill).fill('0'), ...right]
  } else {
    groups = ip.split(':')
  }

  return groups.map(g => g.padStart(4, '0').toLowerCase())
}

export function normalizeIpForRatelimit(ip: string): string {
  if (!ip.includes(':')) return ip
  return expandIPv6(ip).slice(0, IPV6_PREFIX_GROUPS).join(':')
}

export type RatelimitBacking<K> = {
  readKeyTime: (key: K) => Promise<number | null>
  writeKeyTime: (key: K, time: number) => Promise<void>
  /** WARNING: must be in seconds */
  getTime: () => number
}

export type RatelimitConfig = {
  /** minimum number of seconds between events at steady state */
  secondsBetweenEvents: number
  /** number of "burst" events to tolerate before ratelimiting */
  burstEvents: number
}

// https://dotat.at/@/2024-08-30-gcra.html
export const ratelimit = async <K>(
  key: K,
  cfg: RatelimitConfig,
  backing: RatelimitBacking<K>,
): Promise<{ accept: true } | {
  accept: false,
  /** time to retry after in seconds, used in http header */
  retryAfter: number
}> => {
  const windowSize = cfg.burstEvents * cfg.secondsBetweenEvents
  const now = backing.getTime()

  const time = clamp(
    now - windowSize,
    await backing.readKeyTime(key) ?? 0,
    now
  ) + cfg.secondsBetweenEvents

  if (now < time) return {
    accept: false,
    retryAfter: time - now
  }

  // TODO: consider awaiting?
  backing.writeKeyTime(key, time)
  return { accept: true }
}

export const d1backing = (env: Wenv) => ({
  readKeyTime: async (key) => env.DB.prepare(
    `SELECT time FROM Ratelimits WHERE key = ?`
  ).bind(key).first<number>("time"),
  writeKeyTime: async (key, time) => {
    env.DB.prepare(
      `INSERT INTO Ratelimits (key, time) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET time=?2`
    ).bind(key, time).run()
  },
  getTime: () => Date.now() / 1e3,
} satisfies RatelimitBacking<string>)

/** 1 per 6 hours + 2 burst events */
export const restrictiveRatelimit = {
  // 1 per 6 hours
  secondsBetweenEvents: 3600 * 6,
  burstEvents: 2
} satisfies RatelimitConfig
