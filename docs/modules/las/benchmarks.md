import BrowserOnly from '@docusaurus/BrowserOnly';
import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Benchmarks

<LasDocsTabs active="benchmarks" />

These live browser benchmarks use compressed LAZ and Arrow-table output. The LAZ 1.2/PDRF 3 group compares TypeScript, laz-perf, the COPC package decoder, and laz-rs. The LAZ 1.4/PDRF 7 group compares the three compatible variants. Every competitive group parses identical bytes and requests the common point-cloud columns `POSITION`, `COLOR_0`, `intensity`, and `classification`.

The final group measures TypeScript-only streaming and selective-column capabilities. Streaming cases pass pre-split binary LAZ chunks to `parseInBatches`; they do not substitute an atomic parse. Comprehensive cases materialize every represented LAS field, while selective cases request either the common point-cloud columns or only `POSITION` and `COLOR_0`. These workloads are intentionally separated because they perform different amounts of decoding and Arrow allocation.

Fixture download, loader-variant initialization, WASM compilation, and input copying happen before timing starts. Keep this page focused while a run is active.

<BrowserOnly fallback={<p>Loading LAS benchmarks...</p>}>
  {() => {
    const LASBenchmarksApp = require('@site/src/examples/las-benchmarks-app').default;
    return <LASBenchmarksApp />;
  }}
</BrowserOnly>
