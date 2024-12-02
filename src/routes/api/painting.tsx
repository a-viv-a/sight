import type { APIEvent } from "@solidjs/start/server";
import { getRequestEvent } from "solid-js/web";

const env = () => {
  const event = getRequestEvent()
  // fallback to process.env for local development
  const env = event?.nativeEvent.context.cloudflare.env ?? process.env
  return env
}

export async function GET(event: APIEvent) {
  
}
