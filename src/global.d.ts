/// <reference types="@solidjs/start/env" />

import type { Request as CfRequest, ExecutionContext } from "@cloudflare/workers-types"

declare module "vinxi/http" {
  interface H3EventContext {
    cf: CfRequest["cf"]
    cloudflare: {
      request: CfRequest
      env: Wenv,
      context: ExecutionContext
    }
  }
}
