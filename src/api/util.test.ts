import { describe, expect, it } from "vitest"
import { ratelimit, RatelimitBacking, RatelimitConfig } from "./util"

const rl_it = it.extend<{
  backing: RatelimitBacking<string> & {
    advanceTime: (amount: number) => void,
  },
  cfg: RatelimitConfig
}>({
  backing: async ({ }, use) => {
    let internal = {
      time: 10_000,
      kv: new Map<string, number>()
    }

    await use({
      readKey: async key => internal.kv.get(key) ?? null,
      writeKey: async (key, tat) => { internal.kv.set(key, tat) },
      getTime: () => internal.time,

      advanceTime: (amount) => { internal.time += amount },
    })

  },
  cfg: {
    limit: 5,
    period: 100,
  }
})

describe("ratelimit", () => {
  describe("basic behavior", () => {
    rl_it("should always allow first request", async ({ cfg, backing }) => {
      expect(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({ accept: true })
    })
    rl_it("should start rejecting after burst exceeds limit", async ({ cfg, backing }) => {
      for (let i = 0; i < cfg.limit; i++) {
        expect.soft(
          await ratelimit("key", backing.getTime(), cfg, backing),
          `burst setup pt ${i}`
        ).toMatchObject({ accept: true })
        backing.advanceTime(3)
      }

      backing.advanceTime(3)
      expect(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({
        accept: false
      })

      backing.advanceTime(cfg.period / cfg.limit /* 20 */)
      expect(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({
        accept: true
      })
    })
    rl_it("should never deny request at appropriate rate", async ({ cfg, backing }) => {
      for (let i = 0; i < 200; i++) {
        expect(
          await ratelimit("key", backing.getTime(), cfg, backing),
          `request ${i}`
        ).toMatchObject({ accept: true })
        backing.advanceTime(cfg.period / cfg.limit)
      }
    })
    rl_it("should never deny request slower than appropriate rate", async ({ cfg, backing }) => {
      for (let i = 0; i < 200; i++) {
        expect(
          await ratelimit("key", backing.getTime(), cfg, backing),
          `request ${i}`
        ).toMatchObject({ accept: true })
        backing.advanceTime(cfg.period / cfg.limit + 5)
      }
    })
    rl_it("should rate limit per key", async ({ cfg, backing }) => {
      while ((await ratelimit("key", backing.getTime(), cfg, backing)).accept) {
        backing.advanceTime(1)
      }
      expect.soft(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({ accept: false })

      expect(await ratelimit("key2", backing.getTime(), cfg, backing)).toMatchObject({ accept: true })

      expect(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({ accept: false })
    })
  })
  describe("edge cases", () => {
    rl_it("should start allowing more requests if limit increases", async ({ cfg, backing }) => {
      while ((await ratelimit("key", backing.getTime(), cfg, backing)).accept) {
        backing.advanceTime(1)
      }
      expect.soft(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({ accept: false })


      expect(await ratelimit("key", backing.getTime(), {
        ...cfg,
        limit: 10
      }, backing)).toMatchObject({ accept: true })
    })
    // since decreasing the period doesn't actually change the amount of requests that have happened...
    rl_it("should not start allowing more requests if period decreases", async ({ cfg, backing }) => {
      while ((await ratelimit("key", backing.getTime(), cfg, backing)).accept) {
        backing.advanceTime(1)
      }
      expect.soft(await ratelimit("key", backing.getTime(), cfg, backing)).toMatchObject({ accept: false })


      expect(await ratelimit("key", backing.getTime(), {
        ...cfg,
        period: 10
      }, backing)).toMatchObject({ accept: false })
    })
  })

})
