---
title: Compression benchmarks
description: Compare browser decompression paths across native and loaders.gl codec implementations.
hide_title: true
page_style: designed
---

import BrowserOnly from '@docusaurus/BrowserOnly';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · live benchmark"
  title="Compare codec paths on the machine that will run them."
  description="These browser benchmarks put native decompression, compact JavaScript codecs, and injected backends against the same bytes. Results are useful for choosing a path, not for claiming a universal ranking."
  tone="violet"
  meta={['Browser runtime', 'Warm-up aware', 'Bytes per second']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Using workers', to: '/docs/developer-guide/using-worker-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Read the result carefully"
  title="Benchmark the boundary you actually care about."
  description="Warm-up, browser support, bundle size, and output verification all matter alongside throughput. Run the same format and payload when comparing implementations."
  tone="violet"
  items={[
    {label: 'Throughput', value: 'Measured on the uncompressed fixture bytes'},
    {label: 'Correctness', value: 'Every row is checked against expected output'},
    {label: 'Native', value: 'Shown as N/A when the browser lacks support'},
    {label: 'Bundle', value: 'Approximate browser payload indicator'}
  ]}
/>

<ReferenceBoundary
  title="Run the benchmark"
  description="The interactive app below runs the comparison in this browser. Notes underneath define fixtures, warm-up, backend coverage, and known platform variation."
  tone="violet"
/>

These live browser benchmarks compare built-in decompression with the
compact or injected codec paths used by `@loaders.gl/compression`.

This page is part of the [`@loaders.gl/compression` module documentation](/docs/modules/compression).

<BrowserOnly fallback={<p>Loading compression benchmarks...</p>}>
  {() => {
    const CompressionBenchmarksApp = require('@site/src/examples/compression-benchmarks-app').default;
    return <CompressionBenchmarksApp />;
  }}
</BrowserOnly>

### Notes

- Covers GZIP, DEFLATE, Brotli, Snappy, LZ4, bzip2, XZ, and Zstandard.
- `sample.csv` rows decompress the repository’s CSV fixture; each implementation
  receives the same compressed bytes for that format.
- bzip2 and XZ use a small synthetic CSV-style payload repeated across 80 rows.
- Each timed operation decompresses the complete buffer and is checked against
  the expected uncompressed byte count.
- Throughput is measured in bytes per second after warm-up, using the
  uncompressed fixture size as the multiplier.
- Native rows show `N/A` when this browser lacks the required
  `DecompressionStream` format.
- Bundle sizes are approximate browser payload indicators, not
  `node_modules` sizes or exact emitted bundle measurements.
- Every available `compress-utils` format is compared through its public `format-library` adapter.
- Native Zstandard support in Chrome is tracked by
  [Chromium issue 40196713](https://issues.chromium.org/issues/40196713).
- Results vary with browser, hardware, thermal state, and tab focus.
