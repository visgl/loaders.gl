---
title: Apache Arrow format
description: Use Arrow IPC as a typed, columnar interchange between loaders, scans, workers, applications, and writers.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {ArrowDataPlaneGraphic} from '@site/src/components/docs/arrow-data-plane-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import apacheLogo from '../../images/logos/apache-logo.png';

<DocPageHeader
  eyebrow="Binary columnar data"
  title="Apache Arrow"
  description="Apache Arrow keeps columns typed and contiguous as they move between decoders, scanners, workers, analytical code, and writers. loaders.gl provides the format adapters and common table contracts around that physical model."
  tone="cyan"
  logos={[{alt: 'Apache Software Foundation', src: apacheLogo}]}
  meta={['Arrow IPC file and stream', 'Typed columns', 'Zero-copy handoffs']}
  links={[
    {label: 'Arrow overview', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'ArrowLoader', to: '/docs/modules/arrow/api-reference/arrow-loader'},
    {label: 'Binary columnar guide', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<ArrowDocsTabs active="format" />

<ArrowDataPlaneGraphic />

<DocOrientation
  eyebrow="Why Arrow is the common shape"
  title="Decode once. Reuse the columns."
  description="Arrow is useful when data crosses more than one boundary. The same typed buffers can feed a table view, a scan predicate, a worker, a geometry adapter, or a writer without first becoming a large object-row copy."
  tone="cyan"
  items={[
    {label: 'Physical model', value: 'Typed, contiguous buffers with explicit validity and offsets.'},
    {label: 'Application shape', value: 'Tables and geometry tables shared across related formats.'},
    {label: 'Pipeline fit', value: 'Works with batches, range reads, workers, transforms, and writers.'},
    {label: 'Format boundary', value: 'Arrow IPC and GeoArrow metadata remain standards-shaped.'}
  ]}
/>

<ReferenceBoundary
  title="Arrow module details"
  description="The reference below lists the loaders, writers, IPC behavior, metadata, and related GeoArrow paths exposed by the module."
  tone="cyan"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Apache Arrow](/docs/modules/arrow/formats/arrow)                                          |
| Related Format       | [GeoArrow](/docs/modules/arrow/formats/geoarrow)                                           |
| Data Format          | [Tables](/docs/specifications/category-table), [Geometry Tables](/docs/specifications/category-gis) |
| File Extensions      | `.arrow`, `.feather`                                                                       |
| MIME Types           | `application/vnd.apache.arrow.file`, `application/vnd.apache.arrow.stream`                  |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                             |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/arrow-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>ArrowLoader</strong>
    <span>Loads Apache Arrow IPC files and streams as loaders.gl tables.</span>
    <span className="docs-api-card__meta">Output: ArrowTable, table shapes</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/geoarrow-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GeoArrowLoader</strong>
    <span>Loads Arrow data and interprets GeoArrow geometry columns.</span>
    <span className="docs-api-card__meta">Output: Geometry table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/arrow-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>ArrowWriter</strong>
    <span>Writes arrays as Apache Arrow IPC data.</span>
    <span className="docs-api-card__meta">Input: arrays</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

## IPC

`ArrowLoader` reads Apache Arrow IPC file and stream data. IPC streams can be parsed in batches with `parseInBatches`.

Feather V2 is the Arrow IPC file format with a `.feather` extension. Feather V1 is a different
legacy format and is not supported.

### Format capabilities

| Capability | Arrow IPC stream | Arrow IPC file | Feather V2 | Feather V1 |
| --- | :---: | :---: | :---: | :---: |
| Decode complete table | ✅ | ✅ | ✅ | ❌ |
| Decode record batches | ✅ | ✅ | ✅ | ❌ |
| Decode in a worker | ✅ | ✅ | ✅ | ❌ |
| Decode uncompressed data with Apache Arrow JS 17+ | ✅ | ✅ | ✅ | ❌ |
| Decode LZ4-frame buffer compression with Apache Arrow JS 21.2+ | ✅ | ✅ | ✅ | ❌ |
| Decode Zstandard buffer compression with Apache Arrow JS 21.2+ | ✅ | ✅ | ✅ | ❌ |
| Encode with `ArrowWriter` | ✅ | ✅ | ✅ | ❌ |
| Encode LZ4-frame buffer compression with Apache Arrow JS 21.2+ | ✅ | ✅ | ✅ | ❌ |
| Encode Zstandard buffer compression with Apache Arrow JS 21.2+ | ✅¹ | ✅¹ | ✅¹ | ❌ |

¹ Zstandard encoding uses asynchronous `encode()` so its codec can be initialized. LZ4 and
uncompressed output support both `encode()` and `encodeSync()`.

### Embedded compression

Arrow IPC defines exactly two embedded record-batch buffer compression codecs. `ArrowLoader`
supports both:

| Codec | Decode | Encode | Notes |
| --- | :---: | :---: | --- |
| LZ4 Frame (`LZ4_FRAME`) | ✅ | ✅ | Each compressed buffer contains one LZ4 frame. |
| Zstandard (`ZSTD`) | ✅ | ✅¹ | Standard Zstandard frame compression. |

Individual buffers that a Feather writer leaves uncompressed because compression would not reduce
their size are also supported. The codecs are registered only when the installed Apache Arrow JS
runtime exposes IPC compression support (version 21.2.0 or later). Apache Arrow JS 17 through 21.1
remain supported for uncompressed IPC data and report a targeted version requirement when a
compressed record batch is encountered.

## GeoArrow

GeoArrow data is valid Apache Arrow data with geospatial extension metadata and geometry column layouts. Use `GeoArrowLoader` when you want loaders.gl to interpret GeoArrow geometry columns.
