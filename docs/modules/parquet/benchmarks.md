import BrowserOnly from '@docusaurus/BrowserOnly';
import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# Parquet Benchmarks

<ParquetDocsTabs active="benchmarks" />

These benchmarks compare maintained JavaScript and WebAssembly Parquet decode paths on common,
checked-in fixtures. They are a reproducible baseline for finding optimization opportunities in the
loaders.gl TypeScript backend, not a ranking of projects.

The suite runs entirely in your browser. Fixture download and parser initialization happen before
timing; each implementation is warmed up and must return the same row count. Results depend on the
browser, hardware, thermal state, and whether this tab remains focused. Implementations participate
only in scenarios they currently support, so a missing row is not a performance result.

The live suite includes the loaders.gl TypeScript backend, the loaders.gl `parquet-wasm` backend,
and hyparquet. Dependency versions are pinned in the repository lockfile. The corresponding Node
suite adds `@dsnp/parquetjs` and covers additional codecs and projections with `yarn bench parquet`.

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const ParquetBenchmarksApp = require('@site/src/examples/parquet-benchmarks-app').default;
    return <ParquetBenchmarksApp />;
  }}
</BrowserOnly>
