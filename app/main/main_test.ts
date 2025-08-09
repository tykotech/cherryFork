import { add } from "./main.ts";

Deno.test("add", () => {
  if (add(2, 3) !== 5) {
    throw new Error("add failed");
  }
});
