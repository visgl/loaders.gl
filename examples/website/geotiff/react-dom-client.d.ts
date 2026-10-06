declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: unknown): void;
    unmount(): void;
  };
}

declare module '@deck.gl/widgets/stylesheet.css';
