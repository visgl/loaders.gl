// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useRef} from 'react';
import {renderToDOM} from 'examples/website/clustering/app';

/** React host that mounts the framework-independent clustering example. */
export default function ClusteringApp(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    return renderToDOM(container);
  }, []);

  return <div ref={containerRef} style={{height: '100%'}} />;
}
