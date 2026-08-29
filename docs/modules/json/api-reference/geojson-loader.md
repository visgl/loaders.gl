---
title: GeoJSONLoader
description: Stream or decode GeoJSON features into familiar geometry and table shapes.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoJSON loader"
  title="Start with features. Convert later when you need to."
  description="GeoJSONLoader preserves the familiar feature and geometry model while supporting binary geometry, Arrow tables, and incremental parsing for larger documents."
  tone="cyan"
  meta={['RFC 7946', 'Streaming parser', 'Arrow and binary output']}
  links={[
    {label: 'GeoJSON format', to: '/docs/modules/json/formats/geojson'},
    {label: 'JSON module', to: '/docs/modules/json'}
  ]}
/>

<JsonDocsTabs active="geojsonloader" tryItHref="/examples/geospatial/geojson" />

<DocOrientation
  eyebrow="One loader, several useful shapes"
  title="Use objects for clarity and columns for throughput."
  description="Choose the output that matches the next stage of the application. The source document stays GeoJSON; the returned representation can be convenient objects or typed binary columns."
  tone="cyan"
  items={[
    {label: 'Features', value: 'GeoJSON table for mapping and inspection'},
    {label: 'Binary', value: 'Compact geometry buffers'},
    {label: 'Arrow', value: 'Typed columns with WKB geometry'},
    {label: 'Batches', value: 'Incremental results for NDJSON and large inputs'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

Streaming loader for GeoJSON encoded files.

<ReferenceBoundary
  title="GeoJSON usage and output shapes"
  description="The sections below cover simple loading, alternate shapes, streaming, reprojection, and loader options."
  tone="cyan"
/>

GeoJSON is a geospatial interchange format that uses JSON encoding. Use `GeoJSONLoader` for GeoJSON semantics such as features, geometries, feature collections, and GeoArrow WKB output; use `JSONLoader` for arbitrary JSON documents.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.geojson`                                           |
| Media Type     | `application/geo+json`                               |
| File Type      | Text                                                 |
| File Format    | [GeoJSON][format_geojson]                            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

[format_geojson]: https://geojson.org

## Usage

For simple usage, load a GeoJSON `FeatureCollection` as a loaders.gl `GeoJSONTable`:

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoJSONLoader);
```

Use `geojson.shape` to request a different output shape.

```typescript
const binary = await load(url, GeoJSONLoader, {
  geojson: {shape: 'binary-feature-collection'}
});

const arrowTable = await load(url, GeoJSONLoader, {
  geojson: {shape: 'arrow-table'}
});
```

`geojson.shape: 'arrow-table'` converts GeoJSON features to a GeoArrow-compatible Arrow table. Feature `properties` become regular columns and the geometry is written to a binary `geometry` column with `geoarrow.wkb` metadata. Use `json.geoarrowGeometryColumn` to choose a different geometry column name.

For larger files, GeoJSONLoader supports streaming JSON parsing, in which case it yields batches of rows from one array. By default, streamed GeoJSON reads `$.features`. You can override `options.json.jsonpaths` when the feature array is stored elsewhere.

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', GeoJSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

When batch parsing an embedded JSON array as a table, it is possible to get access to the containing object supplying the `{metadata: true}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result` respectively.

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', GeoJSONLoader);

for await (const batch of batches) {
  switch (batch.batchType) {
    case 'partial-result': // contains fields seen so far
    case 'final-result': // contains all fields except the streamed array
      console.log(batch.container);
      break;
    case 'data':
      // batch.data will contain a number of rows
      for (const feature of batch.data) {
        switch (feature.geometry.type) {
          case 'Polygon':
          ...
        }
      }
  }
}
```

## Data Format

Parsed batches are of the format

```ts
{
  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;
  jsonpath: string;

  // standard batch payload
  data: any[] | any;
  bytesUsed: number;
  batchCount: number;
}
```

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `geojson.shape`        |                                                                                       | `string`   | `'geojson-table'`                                                                                                                                | Requested output shape. Supported values are `'geojson-table'`, `'binary-feature-collection'`, and `'arrow-table'`. |
| `json.schema`          |                                                                                       | `Schema \| arrow.Schema` | `undefined`                                                                                                                             | Optional full output schema used when `geojson.shape` is `'arrow-table'`. The schema must include the geometry column. |
| `json.arrowConversion` |                                                                                       | `object`   | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}`                                                  | Optional Arrow conversion policy for `geojson.shape: 'arrow-table'`. `onTypeMismatch: 'null'`, `onMissingField: 'null'`, and `integerConversion: 'null'` write `null` only for nullable fields. `onExtraField: 'drop'` omits fields that are not in the schema. `integerConversion: 'clamp-and-round'` applies lossy integer conversion, and `'warn'` does the same while logging. |
| `json.arrowConversion.viewTypes` |                                                                                | `'never' \| 'prefer' \| 'require'` | `'never'`                                                                                                                        | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode. |
| `json.geoarrowGeometryColumn` |                                                                                 | `string`   | `'geometry'`                                                                                                                                     | Geometry column name used for GeoArrow WKB output. Requires `geojson.shape: 'arrow-table'`. |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `['$.features']`                                                                                                                                 | A list of JSON paths (see below) indicating the array that can be streamed.                                                           |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`  | If `true`, yields an initial and final batch containing the partial and final result (i.e. the root object, excluding the array being streamed). |

## JSONPaths

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](../jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
