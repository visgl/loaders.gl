---
title: LAS benchmarks
description: Compare LAZ decoding and Arrow point-cloud output across browser implementations.
hide_title: true
page_style: designed
---

import BrowserOnly from '@docusaurus/BrowserOnly';
import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="LAS module · live benchmark"
  title="Measure LAZ decoding with the columns your app needs."
  description="These browser benchmarks compare loaders.gl’s TypeScript decoder with alternate implementations while verifying identical point-cloud columns, Arrow types, and row counts."
  tone="orange"
  meta={['LAZ', 'Arrow output', 'Browser runtime']}
  links={[
    {label: 'LAS module', to: '/docs/modules/las'},
    {label: 'LASLoader', to: '/docs/modules/las/api-reference/las-loader'},
    {label: 'Point-cloud category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<LasDocsTabs active="benchmarks" />

<DocOrientation
  eyebrow="Compare like with like"
  title="Keep the output schema fixed while the decoder changes."
  description="Render, common, comprehensive, and streaming groups answer different questions. Compare values within a group and remember that more requested fields means more work."
  tone="orange"
  items={[
    {label: 'Render', value: 'POSITION and COLOR_0 for display'},
    {label: 'Common', value: 'Adds intensity and classification'},
    {label: 'Comprehensive', value: 'Materializes every represented LAS field'},
    {label: 'Streaming', value: 'Feeds pre-split LAZ chunks to parseInBatches'}
  ]}
/>

<ReferenceBoundary
  title="Run the benchmark"
  description="The interactive app below performs verified comparisons. The notes explain fixture setup, decoder initialization, timing boundaries, and how to interpret the groups."
  tone="orange"
/>

These live browser benchmarks use compressed LAZ and Arrow-table output. Each section names a feature workload, and each result row identifies the decoder backend: **loaders.gl (TypeScript)**, **laz-perf (C++ to JS) · 0.0.7**, or **laz-rs (Rust to WASM) · 0.1.0**. The COPC package loader is not listed as a separate backend because it wraps laz-perf. Every competitive comparison parses identical bytes and requests the common point-cloud columns `POSITION`, `COLOR_0`, `intensity`, and `classification`. Benchmark initialization verifies that every implementation returns exactly those four columns with identical Arrow physical types and row counts; the run fails rather than reporting an unfair comparison.

Complete-versus-streaming sections use loaders.gl (TypeScript) for both rows and the same output schema. Streaming cases pass pre-split binary LAZ chunks to `parseInBatches`; they do not substitute an atomic parse. The render workload requests `POSITION` and `COLOR_0`, the common workload adds intensity and classification, and the comprehensive workload materializes every represented LAS field.

Compare numbers only within a group. Comprehensive output is intentionally slower because it now includes GPS time, return metadata, scan flags, and other represented LAS fields. A comprehensive result around 1.4 million points/second is therefore not a regression from a common- or render-column result above 2 million points/second.

Fixture download, implementation initialization, laz-perf Emscripten module startup, laz-rs WebAssembly compilation, and input copying happen before timing starts. laz-perf 0.0.7 is generated JavaScript compiled from C++, not a WebAssembly decoder. Keep this page focused while a run is active.

<BrowserOnly fallback={<p>Loading LAS benchmarks...</p>}>
  {() => {
    const LASBenchmarksApp = require('@site/src/examples/las-benchmarks-app').default;
    return <LASBenchmarksApp />;
  }}
</BrowserOnly>
