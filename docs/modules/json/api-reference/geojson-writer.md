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
| Supported APIs | `encode`, `encodeSync`, `encodeÓInBatches`           |

[format_geojson]: https://geojson.org

## Usage

For simple usage, you can encode a table into a JSON "file" atomically:

```typescript
import {GeoJSONWriter} from '@loaders.gl/json';
import {encode} from '@loaders.gl/core';

const data = await encode(url, GeoJSONWriter, {json: options});
```

### Streaming and JSON paths

For larger files, GeoJSONWriter supports streaming JSON parsing, in which case it will yield "batches" of rows from one array.

```typescript
import {GeoJSONWriter} from '@loaders.gl/json';
import {encodeInBatches} from '@loaders.gl/core';

const batches = await encodeInBatches('geojson.json', GeoJSONWriter, {json: {jsonpaths: ['$.features']}});

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

To parse a stream of GeoJSON, the user can specify the `options.json.jsonpaths` to stream the `features` array.

If no JSONPath is specified the loader will stream the first array it encounters in the JSON payload.

## Data Format

Encoded batches are array buffers or strings

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option           | From                                                                                  | Type       | Default | Description                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`     | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false` | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json.jsonpaths` | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`    | A list of JSON paths (see below) indicating the array that can be streamed.                                                           |

## JSONPaths

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](../jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
