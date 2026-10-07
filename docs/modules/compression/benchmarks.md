---
title: Compression benchmarks
description: Compare browser compression and decompression paths across native and loaders.gl codec implementations.
hide_title: true
page_style: designed
---

import BrowserOnly from '@docusaurus/BrowserOnly';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · live benchmark"
  title="Compare codec paths on the machine that will run them."
  description="These browser benchmarks put native compression and decompression, compact JavaScript codecs, and injected backends against the same bytes. Results are useful for choosing a path, not for claiming a universal ranking."
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

These live browser benchmarks compare built-in compression and decompression with the
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
- bzip2 and XZ use the same CSV payload as the other formats; their fixtures are compressed before timing.
- Each timed decompression operation processes the complete buffer and is checked against
  the expected uncompressed byte count.
- Throughput is measured in bytes per second after warm-up, using the
  uncompressed fixture size as the multiplier.
- Native rows show `N/A` when this browser lacks the required
  `CompressionStream` or `DecompressionStream` format for that table.
- Bundle sizes are approximate browser payload indicators, not
  `node_modules` sizes or exact emitted bundle measurements.
- Every available `compress-utils` format is compared through its public `format-library` adapter.
- Native Zstandard support in Chrome is tracked by
  [Chromium issue 40196713](https://issues.chromium.org/issues/40196713).
- Results vary with browser, hardware, thermal state, and tab focus.

### Internal engine baseline

GZIP and DEFLATE compare the internal fflate 0.7.4 fork with the original npm
implementation on identical compressed input, alongside native, Pako and WASM
backends. Every implementation is verified byte-for-byte before timing; timed
iterations check output length. Keep the tab focused and repeat runs before
judging small differences. These rows measure warm whole-buffer decoding, not
cold import latency, peak memory, or streaming throughput.

Run the hermetic encode/decode baseline with `yarn bench compression` or
`yarn bench-headless compression`. Group labels include input and compressed
byte counts; gzip timestamps are fixed for reproducibility.

For cold imports and bundle/memory baselines, run
`node scripts/measure-compression-engine.mjs`. It emits one JSON record per
implementation, using equivalent minified browser ESM bundles and a fresh Node
process for each engine. Import time excludes process startup. Peak RSS includes
the Node runtime, module initialization, fixture allocation, and one verified
encode/decode per format; it is a process footprint, not isolated codec heap
usage. Bundle bytes cover the six whole-buffer functions, excluding stream
classes and loaders.gl adapters. Repeat this command before comparing timings.

All format groups also include a 16 MiB payload made by repeating and truncating `sample.csv`. Compression runs before timing, and every decoder receives identical compressed bytes. This highly compressible fixture helps compare large-buffer decoding; it does not represent every compression ratio.

### Compression throughput

The compression table measures encoding alone for the same 70 KB and 16 MiB payloads. Every encoder is round-trip verified before timing. Large encoding cases use three serial, single-operation samples to keep expensive encoders from running an automatically expanded iteration batch. Timed iterations check that an output is produced; decoding is outside the timed callback. Encoder-only implementations are listed where available, including compress-utils for all eight formats. Native compression support is probed independently of decompression. Encoders use their defaults, except Brotli uses level 4 and fflate gzip uses a fixed timestamp; these are throughput comparisons, not equal-quality or equal-ratio comparisons.

`zstd-codec` 0.1.5 whole-buffer encoding exhausts its WASM heap at 16 MiB, so that encoder is measured only for the small payload and its large result shows N/A. Its large decompression benchmark remains available; compress-utils encoding covers both sizes.
