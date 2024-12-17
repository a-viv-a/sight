export type RatelimitBacking<K> = {
  readKey: (key: K) => Promise<number | null>
  writeKey: (key: K, tat: number) => Promise<void>
  /** should be in ms */
  getTime: () => number
}

export type RatelimitConfig = {
  /** should be greater than 1... */
  limit: number
  /** period of limit in ms */
  period: number
}

// https://blog.ian.stapletoncordas.co/2018/12/understanding-generic-cell-rate-limiting
// https://dotat.at/@/2024-08-30-gcra.html
export const ratelimit = async <K>(
  key: K,
  arrivedAt: number,
  cfg: RatelimitConfig,
  backing: RatelimitBacking<K>
): Promise<{ accept: true } | {
  accept: false,
  /** time to retry after in seconds, used in http header */
  retryAfter: number
}> => {

  const quantity = 1
  // amount allowed per period
  const emissionInterval = cfg.period / cfg.limit
  const delayVariationTolerance = cfg.period
  const increment = emissionInterval * quantity

  // tat is theoretical arrival time
  const tat = await backing.readKey(key) ?? arrivedAt
  const newTat = Math.max(tat, arrivedAt) + increment
  const allowAt = newTat - delayVariationTolerance

  const remaining = Math.floor(
    ((arrivedAt - allowAt) / emissionInterval) + 0.5
  )

  if (remaining < 1) {
    const retryAfterMs = arrivedAt - allowAt
    return { accept: false, retryAfter: retryAfterMs / 1e3 }
  }

  await backing.writeKey(key, newTat)
  return { accept: true }
}

export const d1backing = (env: Wenv) => ({
  readKey: async (key) => env.DB.prepare(
    `SELECT tat FROM Ratelimits WHERE key = ?`
  ).bind(key).first<number>("tat"),
  writeKey: async (key, tat) => {
    env.DB.prepare(
      `INSERT INTO Ratelimits (key, tat) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET tat=?2`
    ).bind(key, tat).run()
  },
  getTime: Date.now,
} satisfies RatelimitBacking<string>)

// 2.5 actions per hour 
export const restrictiveRatelimit = {
  limit: 15,
  // 6 hours
  period: 2.16e7
} satisfies RatelimitConfig
