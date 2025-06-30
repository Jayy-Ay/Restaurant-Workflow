import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const userBasket = createCookie("basket", {
  maxAge: 604_800, // one week
});
