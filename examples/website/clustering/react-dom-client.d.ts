declare module 'react-dom/client' {
  /** Creates a React root in the standalone example's DOM container. */
  export function createRoot(container: Element | DocumentFragment): {
    /** Renders the example application into this root. */
    render(children: unknown): void;
    /** Unmounts the application and releases this root. */
    unmount(): void;
  };
}
