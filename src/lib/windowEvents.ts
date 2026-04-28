export const WINDOW_OPEN_EVENT = "window:open";
export const WINDOW_RESIZE_EVENT = "window:resize";

export interface WindowOpenEventDetail {
  windowId: string;
}

export interface WindowResizeEventDetail {
  windowId: string;
  size: { width: number; height: number };
  center?: boolean;
}

export const dispatchWindowOpenEvent = (windowId: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<WindowOpenEventDetail>(WINDOW_OPEN_EVENT, {
      detail: { windowId },
    }),
  );
};

export const dispatchWindowResizeEvent = (
  windowId: string,
  size: { width: number; height: number },
  center?: boolean,
) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<WindowResizeEventDetail>(WINDOW_RESIZE_EVENT, {
      detail: { windowId, size, center },
    }),
  );
};

