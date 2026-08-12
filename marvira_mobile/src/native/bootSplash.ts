type ReadyListener = (ready: boolean) => void;

let destinationReady = false;
const listeners = new Set<ReadyListener>();

/**
 * Subscribe to whether Login / EventsList has painted after cold start.
 * Used to keep the launch splash covering the tree until that frame.
 */
export function subscribeDestinationReady(listener: ReadyListener): () => void {
  listeners.add(listener);
  listener(destinationReady);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDestinationReady(): void {
  if (destinationReady) {
    return;
  }
  destinationReady = true;
  listeners.forEach(l => l(true));
}
