LAS module · live benchmark

LAS

# Measure LAZ decoding with the columns your app needs.

These browser benchmarks compare loaders.gl’s TypeScript decoder with alternate implementations while verifying identical point-cloud columns, Arrow types, and row counts.

[LAS module](https://loaders.gl/next/docs/modules/pointclouds/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[Point-cloud category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

LAS[Try It](https://loaders.gl/next/examples/pointclouds/las)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/las/benchmarks.md)[Overview](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/las/format.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

Compare like with like

## Keep the output schema fixed while the decoder changes.

Render, common, comprehensive, and streaming groups answer different questions. Compare values within a group and remember that more requested fields means more work.

01

Render

POSITION and COLOR\_0 for display

02

Common

Adds intensity and classification

03

Comprehensive

Materializes every represented LAS field

04

Streaming

Feeds pre-split LAZ chunks to parseInBatches

Detailed guide

## Run the benchmark

The interactive app below performs verified comparisons. The notes explain fixture setup, decoder initialization, timing boundaries, and how to interpret the groups.

These live browser benchmarks use compressed LAZ and Arrow-table output. Each section names a feature workload, and each result row identifies the decoder backend: **loaders.gl (TypeScript)**, **laz-perf (C++ to JS) · 0.0.7**, or **laz-rs (Rust to WASM) · 0.1.0**. The COPC package loader is not listed as a separate backend because it wraps laz-perf. Every competitive comparison parses identical bytes and requests the common point-cloud columns `POSITION`, `COLOR_0`, `intensity`, and `classification`. Benchmark initialization verifies that every implementation returns exactly those four columns with identical Arrow physical types and row counts; the run fails rather than reporting an unfair comparison.

Complete-versus-streaming sections use loaders.gl (TypeScript) for both rows and the same output schema. Streaming cases pass pre-split binary LAZ chunks to `parseInBatches`; they do not substitute an atomic parse. The render workload requests `POSITION` and `COLOR_0`, the common workload adds intensity and classification, and the comprehensive workload materializes every represented LAS field.

Compare numbers only within a group. Comprehensive output is intentionally slower because it now includes GPS time, return metadata, scan flags, and other represented LAS fields. A comprehensive result around 1.4 million points/second is therefore not a regression from a common- or render-column result above 2 million points/second.

Fixture download, implementation initialization, laz-perf Emscripten module startup, laz-rs WebAssembly compilation, and input copying happen before timing starts. laz-perf 0.0.7 is generated JavaScript compiled from C++, not a WebAssembly decoder. Keep this page focused while a run is active.

Loading LAS benchmarks...
