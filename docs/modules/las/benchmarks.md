import BrowserOnly from '@docusaurus/BrowserOnly';
import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Benchmarks

<LasDocsTabs active="benchmarks" />

These live browser benchmarks use compressed LAZ and Arrow-table output. Each section names a feature workload, and each result row identifies the decoder backend: **loaders.gl (TypeScript)**, **laz-perf v0.0.7 (CPP->JS)**, or **laz-rs v0.1.0 (Rust->WASM)**. The COPC package loader is not listed as a separate backend because it wraps laz-perf. Every competitive comparison parses identical bytes and requests the common point-cloud columns `POSITION`, `COLOR_0`, `intensity`, and `classification`. Benchmark initialization verifies that every implementation returns exactly those four columns with identical Arrow physical types and row counts; the run fails rather than reporting an unfair comparison.

Complete-versus-streaming sections use loaders.gl (TypeScript) for both rows and the same output schema. Streaming cases pass pre-split binary LAZ chunks to `parseInBatches`; they do not substitute an atomic parse. The render workload requests `POSITION` and `COLOR_0`, the common workload adds intensity and classification, and the comprehensive workload materializes every represented LAS field.

Compare numbers only within a group. Comprehensive output is intentionally slower because it now includes GPS time, return metadata, scan flags, and other represented LAS fields. A comprehensive result around 1.4 million points/second is therefore not a regression from a common- or render-column result above 2 million points/second.

Fixture download, implementation initialization, laz-perf Emscripten module startup, laz-rs WebAssembly compilation, and input copying happen before timing starts. laz-perf 0.0.7 is generated JavaScript compiled from C++, not a WebAssembly decoder. Keep this page focused while a run is active.

<BrowserOnly fallback={<p>Loading LAS benchmarks...</p>}>
  {() => {
    const LASBenchmarksApp = require('@site/src/examples/las-benchmarks-app').default;
    return <LASBenchmarksApp />;
  }}
</BrowserOnly>
