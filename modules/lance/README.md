# @loaders.gl/lance

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

Read-only Lance dataset support for loaders.gl.

The current MVP reads and caches the table manifest from a Lance dataset,
including schema fields, fragments, feature flags, and data-file references.
It also parses the fixed footer and metadata tables of individual `.lance` data
files through `LanceSource.getFileMetadata()`, including per-column page
locations, page lengths, and raw encoding descriptors.
The first value-decoding helper supports uncompressed flat fixed-width integer
and floating-point pages through `decodeLanceFlatPage()`.
Multiple pages can be assembled into one typed column with
`decodeLanceFlatColumn()`.

For this initial Arrow MVP, callers provide `lance.columnTypes`—one fixed-width
primitive type per physical column. The one-shot loader returns an Arrow table,
and `LanceSource.readBatches()` emits an Arrow batch. Schema-driven type
inference, nullable values, strings, lists, and compressed layouts remain
future work.

For a remote dataset URL, `LanceSource.readBatches()` uses HTTP range requests
for the first data file. The remote helper also supports the two-dimensional
fixed-size float coordinate columns used by the PushT example.

Physical page decoding for strings, binary values, nullable values, lists, and
compressed layouts remains future work.

See [`examples/lance`](../../examples/lance) for a local Arrow example and a
real Hugging Face Lance dataset example.

There is deliberately no writer API in this package.
