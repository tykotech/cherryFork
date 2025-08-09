/// <reference lib="deno.unstable" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

await start(manifest);
