# Lance

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

The `@loaders.gl/lance` module provides read-only access to Lance dataset
manifests, data-file metadata, and a small Arrow decoding MVP.

## Current scope

- Reads versioned Lance manifests and fragments.
- Reads fixed-width integer and floating-point columns.
- Reads selected remote columns with HTTP range requests.
- Reads two-dimensional fixed-size float coordinate columns, used by the
  PushT trajectory example.
- Returns decoded values as Apache Arrow tables.

Strings, binary/image columns, nullable values, general lists, compressed
encodings, predicate pushdown, and writes are not yet supported.

## APIs

- [`LanceSourceLoader`](/docs/modules/lance/api-reference/lance-source-loader)
  reads dataset metadata and local or remote Arrow batches.
- The parser helpers are available from the
  [`@loaders.gl/lance/lance-arrow`](/docs/modules/lance/api-reference/lance-arrow)
  subpath. They read selected primitive or two-dimensional coordinate columns
  with HTTP ranges.

See the [Lance browser example](https://github.com/visgl/loaders.gl/tree/master/examples/lance/browser)
for a curated Hugging Face picker, LAION scalar table, and PushT deck.gl coordinate view.
