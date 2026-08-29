---
title: Apache Arrow format
description: Use Arrow IPC as a typed, columnar interchange between loaders, scans, workers, applications, and writers.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Binary columnar data"
  title="One table shape for the whole pipeline."
  description="Apache Arrow keeps columns typed and contiguous as they move between decoders, scanners, workers, analytical code, and writers. loaders.gl provides the format adapters and common table contracts around that physical model."
  tone="cyan"
  meta={['Arrow IPC file and stream', 'Typed columns', 'Zero-copy handoffs']}
  links={[
    {label: 'Arrow overview', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'ArrowLoader', to: '/docs/modules/arrow/api-reference/arrow-loader'},
    {label: 'Binary columnar guide', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<ArrowDocsTabs active="format" />

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
| Writer APIs          | `encodeSync`                                                                               |

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
    <span className="docs-api-card__meta">APIs: encodeSync</span>
  </a>
</div>

## IPC

`ArrowLoader` reads Apache Arrow IPC file and stream data. IPC streams can be parsed in batches with `parseInBatches`.

## GeoArrow

GeoArrow data is valid Apache Arrow data with geospatial extension metadata and geometry column layouts. Use `GeoArrowLoader` when you want loaders.gl to interpret GeoArrow geometry columns.
