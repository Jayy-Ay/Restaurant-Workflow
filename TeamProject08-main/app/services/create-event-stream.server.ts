import { eventStream } from "remix-utils/sse/server";
import { emitter } from "./emitter.server";

/**
 * Creates an event stream for server-sent events (SSE).
 *
 * This function sets up an event stream that listens for a specific event
 * and sends data to the client. It also includes a heartbeat mechanism
 * to keep the connection alive.
 *
 * The event stream sends:
 * - The event data when the specified event is emitted.
 * - A "heartbeat" event with a "ping" message every 15 seconds to keep the connection alive.
 *
 */
export function createEventStream(request: Request, eventName: string) {
  return eventStream(request.signal, (send) => {
    const handle = (event: string) => {
      send({
        data: event ?? String(Date.now()),
      });
    };

    emitter.addListener(eventName, handle);

    const heartbeatInterval = setInterval(() => {
      send({ event: "heartbeat", data: "ping" });
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      emitter.removeListener(eventName, handle);
    };
  });
}
