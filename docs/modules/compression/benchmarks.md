import BrowserOnly from '@docusaurus/BrowserOnly';

# Compression Benchmarks

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
