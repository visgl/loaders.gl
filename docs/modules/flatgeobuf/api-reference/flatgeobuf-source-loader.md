---
title: FlatGeobufSourceLoader
description: Query indexed FlatGeobuf datasets with HTTP ranges.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {FlatGeobufDocsTabs} from '@site/src/components/docs/flatgeobuf-docs-tabs';

<DocPageHeader
  eyebrow="FlatGeobuf source loader"
  title="Query an indexed vector file from the browser."
  description="`FlatGeobufSourceLoader` uses the FlatGeobuf spatial index and HTTP range requests to return only the features needed for a query. It can expose GeoJSON-style, binary, or Arrow table results."
  tone="cyan"
  meta={['FlatGeobuf', 'Spatial index', 'HTTP range requests']}
  links={[
    {label: 'FlatGeobuf module', to: '/docs/modules/flatgeobuf'},
    {label: 'FlatGeobuf format', to: '/docs/modules/flatgeobuf/formats/flatgeobuf'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The indexed query path"
  title="Read the header. Select the index ranges. Return matching features."
  description="A FlatGeobuf source keeps the file remote and lets the spatial index narrow the bytes before geometry decoding."
  tone="cyan"
  items={[
    {label: 'Open', value: 'Remote `.fgb` URL or supported loaded data'},
    {label: 'Filter', value: 'Bounding box, layers, and output format'},
    {label: 'Transport', value: 'Coalesced byte ranges for selected index nodes'},
    {label: 'Output', value: 'GeoJSON table, binary features, or Arrow table'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/range_requests-From_v5.0-blue.svg?style=flat-square" alt="range requests from v5.0" />
</p>

<FlatGeobufDocsTabs active="source" />

<ReferenceBoundary
  title="Source behavior and output contracts"
  description="The reference below covers construction, query results, metadata, CRS handling, range requirements, and empty-result behavior."
  tone="cyan"
/>

The `FlatGeobufSourceLoader` creates an indexed vector source for remote `.fgb` datasets and serves viewport-sized feature subsets through HTTP range requests.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {FlatGeobufSourceLoader} from '@loaders.gl/flatgeobuf';

const source = createDataSource(url, [FlatGeobufSourceLoader]);

const arrowTable = await source.getFeatures({
  layers: 'dataset',
  boundingBox: [
    [-12, 35],
    [30, 60]
  ],
  format: 'arrow'
});
```

## Outputs

- `format: 'geojson'` returns a `GeoJSONTable`.
- `format: 'binary'` returns a binary feature collection.
- `format: 'arrow'` returns an Arrow table with FlatGeobuf property columns plus a WKB `geometry` column annotated with geospatial schema metadata.

## Metadata

`getMetadata()` returns one logical source layer for the dataset, including:

- dataset name and title when available
- source bounds from the FlatGeobuf header envelope
- CRS identifiers from the FlatGeobuf header
- optional `formatSpecificMetadata` when requested

## Notes

- `FlatGeobufSourceLoader` is optimized for remote URL access and expects byte-range fetches.
- Bounding box requests use the FlatGeobuf spatial index when present and return empty valid tables when nothing matches.
- Source-level reprojection matches `FlatGeobufLoader` behavior.
