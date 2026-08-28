import "@testing-library/jest-dom/vitest";

// jsdom does not implement these browser APIs, but Ant Design relies on them
// (responsive breakpoints, resize-observing elements like Table/Tooltip).
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  if (!("ResizeObserver" in window)) {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error - jsdom has no ResizeObserver implementation
    window.ResizeObserver = ResizeObserverMock;
    globalThis.ResizeObserver = ResizeObserverMock;
  }
}
