---
title: FlatGeobuf format
description: Read indexed binary geospatial features with optional streaming, Arrow output, and spatially selective access.
hide_title: true
page_style: designed
---

import {FlatGeobufDocsTabs} from '@site/src/components/docs/flatgeobuf-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Indexed geospatial format"
  title="A binary feature stream with a spatial index."
  description="FlatGeobuf stores geospatial features in a compact binary layout and can include a packed Hilbert R-tree. loaders.gl uses that structure for streaming, Arrow conversion, and viewport-sized reads from remote files."
  tone="cyan"
  meta={['Binary features', 'Packed spatial index', 'Range-friendly']}
  links={[
    {label: 'FlatGeobuf module', to: '/docs/modules/flatgeobuf'},
    {label: 'FlatGeobufLoader', to: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader'},
    {label: 'Remote source', to: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader'}
  ]}
/>

<FlatGeobufDocsTabs active="format" />

<DocOrientation
  eyebrow="Indexed feature data"
  title="Read features without downloading unrelated space."
  description="FlatGeobuf keeps feature records binary and streamable, while its optional index lets a source select records intersecting a bounding box before decoding the complete file."
  tone="cyan"
  items={[
    {label: 'Header', value: 'Schema, geometry metadata, bounds, and optional index information.'},
    {label: 'Index', value: 'Packed spatial nodes guide bounding-box range requests.'},
    {label: 'Decode', value: 'Return GeoJSON, Arrow, columnar, or binary feature data.'},
    {label: 'Stream', value: 'Process features incrementally when a complete table is unnecessary.'}
  ]}
/>

<ReferenceBoundary
  title="FlatGeobuf format and API details"
  description="The reference below covers the binary layout, spatial index, feature encodings, streaming behavior, and source selection rules."
  tone="cyan"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [FlatGeobuf](/docs/modules/flatgeobuf/formats/flatgeobuf)                                  |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), Arrow tables, binary features         |
| File Extension       | `.fgb`                                                                                     |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `loadInBatches`, `parse`, `parseSync`, `parseInBatches`                            |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |
| Source APIs          | `createDataSource`, `getMetadata`, `getSchema`, `getFeatures`                              |

## Loaders and Sources

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>FlatGeobufLoader</strong>
    <span>Loads FlatGeobuf files as GeoJSON, Arrow, columnar, or binary geometry data.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ArrowTable, ColumnarTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader">
    <span className="docs-api-card__kind">Source</span>
    <strong>FlatGeobufSourceLoader</strong>
    <span>Creates an indexed vector source for remote FlatGeobuf datasets.</span>
    <span className="docs-api-card__meta">Output: VectorSource</span>
    <span className="docs-api-card__meta">APIs: createDataSource, getFeatures</span>
  </a>
</div>

## Spatial Indexes

FlatGeobuf files can include a packed spatial index for range-request access. `FlatGeobufSourceLoader` uses that index when present to fetch viewport-sized feature subsets from remote files.

## Arrow

Set `flatgeobuf.shape: 'arrow-table'` to preserve FlatGeobuf property columns in an Arrow table and append a WKB `geometry` column with geospatial metadata.
