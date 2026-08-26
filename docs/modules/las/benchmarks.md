import BrowserOnly from '@docusaurus/BrowserOnly';
import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Benchmarks

<LasDocsTabs active="benchmarks" />

These live browser benchmarks use compressed LAZ and Arrow-table output. Groups labeled **Backend head-to-head** compare TypeScript with every compatible loader variant: LAZ 1.2/PDRF 3 compares TypeScript, laz-perf, the COPC package decoder, and laz-rs; LAZ 1.4/PDRF 7 compares TypeScript, the COPC package decoder, and laz-rs. Every backend comparison parses identical bytes and materializes the common point-cloud columns `POSITION`, `COLOR_0`, `intensity`, and `classification`.

Groups labeled **TypeScript path** compare complete parsing with true streaming for the same output schema. Streaming cases pass pre-split binary LAZ chunks to `parseInBatches`; they do not substitute an atomic parse. The render workload requests `POSITION` and `COLOR_0`, the common workload adds intensity and classification, and the comprehensive workload materializes every represented LAS field.

Compare numbers only within a group. Comprehensive output is intentionally slower because it now includes GPS time, return metadata, scan flags, and other represented LAS fields. A comprehensive result around 1.4 million points/second is therefore not a regression from a common- or render-column result above 2 million points/second.

Fixture download, loader-variant initialization, WASM compilation, and input copying happen before timing starts. Keep this page focused while a run is active.

<BrowserOnly fallback={<p>Loading LAS benchmarks...</p>}>
  {() => {
    const LASBenchmarksApp = require('@site/src/examples/las-benchmarks-app').default;
    return <LASBenchmarksApp />;
  }}
</BrowserOnly>
