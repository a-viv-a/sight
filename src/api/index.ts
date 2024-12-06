import { action, query } from "@solidjs/router";
import { getPaintingsRPC, addPaintingRPC } from "./server";

export const getPaintings = query(getPaintingsRPC, "getPaintings")
export const addPainting = action(addPaintingRPC, "addPainting")
