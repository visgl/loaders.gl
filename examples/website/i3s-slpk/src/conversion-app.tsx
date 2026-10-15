import React from 'react';
import {createRoot} from 'react-dom/client';
import {ConversionPanel} from './components/conversion-panel';

/** Inline 3D Tiles/I3S conversion without loading the map viewer. */
export default function TileConversionApp() {
  return <ConversionPanel />;
}

/** Mounts the standalone conversion form. */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<TileConversionApp />);
}
