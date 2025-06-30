import type { LoaderFunctionArgs } from "@remix-run/node";
import { createEventStream } from "~/services/create-event-stream.server";

export function loader({ request }: LoaderFunctionArgs) {
  return createEventStream(request, "dashboard:orders");
}
