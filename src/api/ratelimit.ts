import { clamp } from "../utils"

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

/** 2 per hour + 8 burst events */
export const restrictiveRatelimit = {
  // 2 per hour
  secondsBetweenEvents: 3600 / 2,
  burstEvents: 8
} satisfies RatelimitConfig
