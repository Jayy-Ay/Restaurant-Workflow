import { useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { errorToast, warningToast } from "~/services/toast";

export function useEventStream(url: string) {
  const [data, setData] = useState<any>();
  const [error, setError] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0); // Track retry attempts
  const submit = useSubmit();

  useEffect(() => {
    const connect = () => {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Handle incoming messages
      const handleMessage = (event: MessageEvent) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          console.log(event);

          // Show toast notification
          if (parsedData.type === "message") {
            warningToast(parsedData.message);
          } else if (parsedData.type === "update-basket") {
            submit(parsedData, { method: "post", action: "/api/basket" });
          } else if (parsedData.type === "update-order") {
          } else {
            warningToast(parsedData.message);
          }
        } catch (err) {
          console.error("Failed to parse SSE data:", err);
          setError(err);
        }
      };

      // Handle errors and attempt reconnection
      const handleError = (err: Event) => {
        console.error("SSE error:", err);
        setError(err);
        eventSource.close();
        attemptReconnect(); // Try to reconnect
      };

      eventSource.onmessage = handleMessage;
      eventSource.onerror = handleError;
    };

    const attemptReconnect = () => {
      if (retryTimeoutRef.current) return; // Avoid multiple retries

      const retryDelay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000); // Exponential backoff with max 30s
      retryTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        console.log(`Reconnecting... Attempt #${reconnectAttempts.current}`);
        connect();
        retryTimeoutRef.current = null; // Clear timeout reference after reconnect
      }, retryDelay);
    };

    // Establish initial connection
    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      reconnectAttempts.current = 0; // Reset attempts on cleanup
    };
  }, [url]);

  return { data, error, setData };
}
