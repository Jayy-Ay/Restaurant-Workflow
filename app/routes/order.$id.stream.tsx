import type { LoaderFunctionArgs } from "@remix-run/node";
import { custAuth } from "~/services/auth.server";
import { createEventStream } from "~/services/create-event-stream.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await custAuth.isAuthenticated(request);
  if (!user) throw new Error("Unauthorized");

  return createEventStream(request, `orders:customer:${params.id}`);
}
