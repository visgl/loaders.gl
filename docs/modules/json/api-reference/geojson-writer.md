---
title: GeoJSONWriter
description: Encode loaders.gl geospatial data as GeoJSON or newline-delimited features.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · geospatial writer"
  title="GeoJSONWriter"
  description="Encode loaders.gl geospatial tables as GeoJSON, keeping feature geometry and properties in a format that mapping tools and web APIs understand."
  tone="mint"
  meta={['From v4.0', 'GeoJSON', 'Streaming output']}
  links={[
    {label: 'GeoJSON format', to: '/docs/modules/json/formats/geojson'},
    {label: 'GeoJSONLoader', to: '/docs/modules/json/api-reference/geojson-loader'},
    {label: 'JSON module', to: '/docs/modules/json'}
  ]}
/>

<JsonDocsTabs active="geojsonwriter" tryItHref="/examples/geospatial/geojson" />

<DocOrientation
  eyebrow="What it writes"
  title="Send table data back to the map as features."
  description="GeoJSONWriter converts table-shaped geospatial data into a FeatureCollection or feature stream, with an incremental path for larger outputs."
  tone="mint"
  items={[
    {label: 'Input', value: 'GeoJSON tables and geometry columns'},
    {label: 'Output', value: 'GeoJSON features and collections'},
    {label: 'Streaming', value: 'Incremental feature batches'},
    {label: 'Boundary', value: 'Readable web and GIS interchange'}
  ]}
/>

<ReferenceBoundary
  title="GeoJSONWriter reference"
  description="The sections below document format metadata, usage, streaming, output shapes, and writer options."
  tone="mint"
/>

Streaming writer for GeoJSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.geojson`                                           |
| Media Type     | `application/geo+json`                               |
| File Type      | Text                                                 |
| File Format    | [GeoJSON][format_geojson]                            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `encode`, `encodeInBatches`           |

[format_geojson]: https://geojson.org

## Usage

Encode a loaders.gl table containing geometry into a GeoJSON FeatureCollection.
For example, an object-row table can contain WKT geometry strings in a named column:

```typescript
import {GeoJSONWriter} from '@loaders.gl/json';
import {encode} from '@loaders.gl/core';

const table = {
  shape: 'object-row-table',
  schema: {
    fields: [{name: 'geometry', type: 'utf8'}, {name: 'name', type: 'utf8'}],
    metadata: {}
  },
  data: [{geometry: 'POINT (1 2)', name: 'Example'}]
};
const bytes = await encode(table, GeoJSONWriter);
const text = new TextDecoder().decode(bytes);
```

## Streaming output

Pass an iterable of table batches to `encodeInBatches`. Each output chunk is
an `ArrayBuffer` containing UTF-8 text; join chunks in order to form the complete
GeoJSON document. Output chunks are not parsed feature batches.

```typescript
import {GeoJSONWriter} from '@loaders.gl/json';
import {encodeInBatches} from '@loaders.gl/core';

const chunks = await encodeInBatches(tableBatches, GeoJSONWriter);
for await (const bytes of chunks) {
  // Forward each encoded chunk to the application's output stream.
  await output.write(bytes);
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `geojson.featureArray` | `false` | Writes a feature array instead of a FeatureCollection wrapper. |
| `geojson.geometryColumn` | `null` | Index of the geometry column; inferred when omitted. |
| `chunkSize` | `10000` | Target encoded chunk size in bytes. |

`GeoJSONWriter` supports asynchronous `encode` and `encodeInBatches`. It does
not provide `encodeSync`. JSONPath options belong to JSON parsing and are not
writer options.
