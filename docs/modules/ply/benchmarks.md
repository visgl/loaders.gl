import BrowserOnly from '@docusaurus/BrowserOnly';
import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

# PLY Benchmarks

<PlyDocsTabs active="benchmarks" />

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const PlyBenchmarksApp = require('@site/src/examples/ply-benchmarks-app').default;
    return <PlyBenchmarksApp />;
  }}
</BrowserOnly>
