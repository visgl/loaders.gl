// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useRef} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {renderToDOM} from 'examples/website/mlt/src/main';

/**
 * React wrapper mounting the MLT example into the docs layout.
 */
export default function MLTExample() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mapElement = document.createElement('div');
    mapElement.style.width = '100%';
    mapElement.style.height = '100%';

    containerRef.current.appendChild(mapElement);

    const mapController = renderToDOM(mapElement);

    return () => {
      mapController.remove();
      mapElement.remove();
    };
  }, []);

  return <div ref={containerRef} style={{position: 'relative', width: '100%', height: '100%'}} />;
}
