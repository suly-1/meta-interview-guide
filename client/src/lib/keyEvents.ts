// keyEvents — lightweight event bus for cross-component keyboard shortcut wiring
// Components subscribe to named events; Home.tsx dispatches them via keyboard hook

type KeyEventName = "timer:toggle" | "drill:reveal";

type Listener = () => void;

const listeners: Record<string, Set<Listener>> = {};

export function onKeyEvent(name: KeyEventName, fn: Listener): () => void {
  if (!listeners[name]) listeners[name] = new Set();
  listeners[name].add(fn);
  return () => listeners[name].delete(fn);
}

export function emitKeyEvent(name: KeyEventName): void {
  listeners[name]?.forEach((fn) => fn());
}
