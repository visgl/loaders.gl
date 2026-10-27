// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useRef} from 'react';
import {renderToDOM} from 'examples/website/i3s-profile-gallery/src/app';

/** React adapter that mounts the framework-independent I3S profile gallery in the website. */
export default function I3SProfileGalleryApp(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    return renderToDOM(container);
  }, []);

  return <div ref={containerRef} />;
}
