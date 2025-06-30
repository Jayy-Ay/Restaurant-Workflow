import { type LoaderFunctionArgs } from "@remix-run/node";
import { createEventStream } from "~/services/create-event-stream.server";
// Loader function to handle server-sent events for user notifications
export function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const user = url.searchParams.get("user");

  // If no user is specified in the query parameters, return null
  if (!user) return null;

  // Create an event stream for the user's notifications
  return createEventStream(request, "menu:notifications:" + user);
}
