export const RESTART_EVENT = "sh-tour-restart";

export function restartTour(): void {
  window.dispatchEvent(new Event(RESTART_EVENT));
}
