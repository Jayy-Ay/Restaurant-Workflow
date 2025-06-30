import type { LoaderFunctionArgs } from "@remix-run/node";
import { createEventStream } from "~/services/create-event-stream.server";

export function loader({ request, params }: LoaderFunctionArgs) {
  return createEventStream(request, "dashboard:orders");
}
