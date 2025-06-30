import { EventEmitter } from "events";
import { remember } from "@epic-web/remember";

/**
 * Creates and exports a singleton instance of an EventEmitter.
 * The instance is memoized using the `remember` function to ensure
 * that the same instance is reused across the application.
 *
 * This is useful for managing and emitting events in a centralized manner.
 */
export const emitter = remember("emitter", () => new EventEmitter());
