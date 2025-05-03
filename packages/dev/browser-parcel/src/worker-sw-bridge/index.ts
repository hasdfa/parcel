export const EventsToSW = {
  UPLOAD_FILES: 'UPLOAD_FILES',
} as const;

export const EventsFromSW = {
  UPLOAD_FILES_FINISHED: 'UPLOAD_FILES_FINISHED',
} as const;

export type EventsToSW = typeof EventsToSW;
export type EventsFromSW = typeof EventsFromSW;

export type SWBridgeEvent = EventsToSW | EventsFromSW;
