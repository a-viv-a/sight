import { getRequestEvent } from "solid-js/web"
import { H3EventContext } from "vinxi/http"
import { IS_PRODUCTION } from "~/mode"

export const useEvent = async () => {
  const event = getRequestEvent()
  if (event === undefined) {
    throw new Error("missing event details")
  }

  let cf = event?.nativeEvent.context.cloudflare
  if (cf === undefined) {
    if (IS_PRODUCTION)
      throw new Error("missing cloudflare event details")

    console.warn("mocking out cloudflare with wrangler platform proxy")
    cf = await (await import("wrangler")).getPlatformProxy() as H3EventContext["Cloudflare"]
  }
  if (event.request === undefined) {
    throw new Error("missing request details")
  }
  return { env: cf.env, ...event }
}

