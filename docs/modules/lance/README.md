---
title: Lance
description: Read selected Lance dataset columns into Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {CrossFormatScanEngineGraphic} from '@site/src/components/docs/cross-format-scan-engine-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Lance module"
  title="Read columnar dataset fragments without loading everything."
  description="`@loaders.gl/lance` provides a focused, read-only path through Lance manifests, fragments, and selected primitive columns. It uses Arrow tables as the result and HTTP ranges for remote column reads."
  tone="cyan"
  meta={['Lance datasets', 'Selected columns', 'Arrow output']}
  links={[
    {label: 'Lance APIs', to: '/docs/modules/lance/api-reference/lance-source-loader'},
    {label: 'Arrow data plane', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Lance example', to: 'https://github.com/visgl/loaders.gl/tree/master/examples/lance/browser'}
  ]}
/>

<CrossFormatScanEngineGraphic />

<DocOrientation
  eyebrow="The Lance read path"
  title="Read metadata. Select columns. Decode Arrow data."
  description="The current module keeps its supported surface explicit: remote range reads and primitive columns are implemented, while unsupported encodings and writes remain outside the advertised contract."
  tone="cyan"
  items={[
    {label: 'Discover', value: 'Versioned manifests, fragments, and data files'},
    {label: 'Select', value: 'Primitive scalar or 2D coordinate columns'},
    {label: 'Transport', value: 'Local reads or HTTP byte ranges'},
    {label: 'Output', value: 'Decoded Apache Arrow tables'}
  ]}
/>

<ReferenceBoundary
  title="Current scope and APIs"
  description="The reference below documents supported column types, source and parser entry points, known limitations, and the browser example."
  tone="cyan"
/>

<p className="badges">
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
