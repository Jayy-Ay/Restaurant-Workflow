import {
  useLoaderData,
  useResolvedPath,
  useRevalidator,
} from "@remix-run/react";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";

// This hook is used to enable live updates for a loader in a Remix application.
export function useLiveLoader<T>() {
  // Resolve the path to the stream endpoint.
  const path = useResolvedPath("./stream");

  // Use the event source to listen for server-sent events from the resolved path.
  const data = useEventSource(path.pathname);

  // Get the revalidate function to manually trigger a revalidation of the loader.
  const { revalidate } = useRevalidator();

  // Trigger revalidation whenever new data is received from the event source.
  useEffect(() => {
    revalidate();
  }, [data]);

  // Return the loader data of the specified type.
  return useLoaderData<T>();
}