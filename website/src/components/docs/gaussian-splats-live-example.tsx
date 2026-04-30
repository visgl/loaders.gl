import BrowserOnly from '@docusaurus/BrowserOnly';
import React, {Suspense} from 'react';

const GaussianSplatsApp = React.lazy(() => import('examples/website/gaussian-splats/app'));

/** Renders the Gaussian splats WebGPU example only in the browser. */
export function GaussianSplatsLiveExample() {
  return (
    <BrowserOnly fallback={<div style={{height: 460}} />}>
      {() => (
        <Suspense fallback={<div style={{height: 460}} />}>
          <GaussianSplatsApp />
        </Suspense>
      )}
    </BrowserOnly>
  );
}
