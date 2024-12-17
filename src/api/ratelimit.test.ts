import { describe, expect, it } from "vitest"
import { ratelimit, RatelimitBacking, RatelimitConfig, restrictiveRatelimit } from "./ratelimit"

const rl_it = it.extend<{
  backing: RatelimitBacking<string> & {
    advanceTime: (amount: number) => void,
  },
  cfg: RatelimitConfig
}>({
  backing: async ({ }, use) => {
    let internal = {
      // year 2000 in seconds to ms
      time: 946684800 * 1e3,
      kv: new Map<string, number>()
    }

    await use({
      readKeyTime: async key => internal.kv.get(key) ?? null,
      writeKeyTime: async (key, tat) => { internal.kv.set(key, tat) },
      getTime: () => internal.time / 1e3,

      advanceTime: (amount) => { internal.time += 1e3 * amount },
    })

  },
  cfg: {
    ratePerSecond: 1/20,
    burstFactor: 2 
  } satisfies RatelimitConfig
})

const computeBurstCapacity = (cfg: RatelimitConfig )=> 
  1 / (cfg.burstFactor * (1 / cfg.ratePerSecond))

describe("basic behavior", () => {
  rl_it("should always allow first request", async ({ cfg, backing }) => {
    expect(await ratelimit("key", cfg, backing)).toMatchObject({ accept: true })
  })
  rl_it("should start rejecting after burst exceeds limit", async ({ cfg, backing }) => {
    for (let i = 0; i < computeBurstCapacity(cfg) + 1; i++) {
      expect(
        await ratelimit("key", cfg, backing),
        `burst setup pt ${i}`
      ).toMatchObject({ accept: true })
    }

    expect(await ratelimit("key", cfg, backing)).toMatchObject({
      accept: false
    })

    backing.advanceTime(1 / cfg.ratePerSecond)
    expect(await ratelimit("key", cfg, backing)).toMatchObject({
      accept: true
    })
  })
  rl_it("should never deny request at appropriate rate", async ({ cfg, backing }) => {
    for (let i = 0; i < 200; i++) {
      expect(
        await ratelimit("key", cfg, backing),
        `request ${i}`
      ).toMatchObject({ accept: true })
      backing.advanceTime(1 / cfg.ratePerSecond)
    }
  })
  rl_it("should never deny request slower than appropriate rate", async ({ cfg, backing }) => {
    for (let i = 0; i < 200; i++) {
      expect(
        await ratelimit("key", cfg, backing),
        `request ${i}`
      ).toMatchObject({ accept: true })
      backing.advanceTime(1 / cfg.ratePerSecond + 5)
    }
  })
  rl_it("should rate limit per key", async ({ cfg, backing }) => {
    while ((await ratelimit("key", cfg, backing)).accept) {
      backing.advanceTime(1)
    }
    expect.soft(await ratelimit("key", cfg, backing)).toMatchObject({ accept: false })

    expect(await ratelimit("key2", cfg, backing)).toMatchObject({ accept: true })

    expect(await ratelimit("key", cfg, backing)).toMatchObject({ accept: false })
  })
})

describe("retryAfter", () => {
  rl_it("should exist when not accepted", async ({ cfg, backing }) => {
    while ((await ratelimit("key", cfg, backing)).accept) {
      backing.advanceTime(1)
    }

    expect(await ratelimit("key", cfg, backing)).toHaveProperty("retryAfter")
  })
  rl_it("should not accept before duration", async ({ cfg, backing }) => {
    while ((await ratelimit("key", cfg, backing)).accept) {
      backing.advanceTime(1)
    }
    // @ts-expect-error might not have retry after!
    const retryAfter = (await ratelimit("key", cfg, backing)).retryAfter

    /** time to stop early by in seconds */
    const stopEarlyBy = 3
    expect.soft(retryAfter).toBeGreaterThan(stopEarlyBy * 2)

    expect((await ratelimit("key", cfg, backing)).accept).toBe(false)
    backing.advanceTime(retryAfter - stopEarlyBy)
    expect.soft(await ratelimit("key", cfg, backing)).toMatchObject({
      accept: false,
      retryAfter: stopEarlyBy
    })
    backing.advanceTime(stopEarlyBy)
    expect((await ratelimit("key", cfg, backing)).accept).toBe(true)
  })
})

describe("server config", () => {
  rl_it("should not allow spam", async ({ backing }) => {
    expect.soft(
      restrictiveRatelimit.ratePerSecond * 3600,
      "actions per hour"
    ).lessThan(5)

    // 15 requests, every 30 seconds
    for (let i = 0; i < 15; i++) {
      await ratelimit("key", restrictiveRatelimit, backing)
      backing.advanceTime(30)
    }

    expect(await ratelimit("key", restrictiveRatelimit, backing)).toMatchObject({ accept: false })
  })
})
