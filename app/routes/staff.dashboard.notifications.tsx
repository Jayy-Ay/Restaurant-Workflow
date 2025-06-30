import { type LoaderFunctionArgs } from "@remix-run/node";
import { createEventStream } from "~/services/create-event-stream.server";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  if (!role) return null;

  return createEventStream(request, "notifications:" + role);
}
