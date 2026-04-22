# JSONWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Streaming writer for GeoJSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.geojson`                                           |
| Media Type     | `application/geo+json`                               |
| File Type      | Text                                                 |
| File Format    | JSON                                                 |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `encode`, `encodeSync`, `encodeÓInBatches`           |

## Usage

For simple usage, you can encode a table into a JSON "file" atomically:

```typescript
import {JSONWriter} from '@loaders.gl/json';
import {encode} from '@loaders.gl/core';

const data = await encode(url, JSONWriter, {json: options});
```

`JSONWriter` accepts loaders.gl row, columnar, and Arrow tables. Arrow table inputs are serialized as JSON row objects by default.

```typescript
const json = await encode(arrowTable, JSONWriter, {
  json: {shape: 'arrow-table'}
});
```

If an Arrow table has a `geoarrow.wkb` geometry column, `JSONWriter` decodes that column to GeoJSON geometry objects before serializing. This keeps JSON output readable while preserving the writer's normal array-of-rows shape.

```typescript
const json = await encode(geoArrowTable, JSONWriter);
// [{"name":"A","geometry":{"type":"Point","coordinates":[1,2]}}]
```

Set `json.geoarrow: 'none'` to serialize the raw WKB values instead.

### Streaming and JSON paths

For larger files, JSONWriter supports streaming JSON parsing, in which case it will yield "batches" of rows from one array.

```typescript
import {JSONWriter} from '@loaders.gl/json';
import {encodeInBatches} from '@loaders.gl/core';

const batches = await encodeInBatches('geojson.json', JSONWriter, {json: {jsonpaths: ['$.features']}});

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
| `json.shape`     |                                                                                       | `string`   | `'object-row-table'` | Requested JSON row shape. Supported values are `'object-row-table'`, `'array-row-table'`, and `'arrow-table'`. `'arrow-table'` is accepted for Arrow table inputs and serializes rows as objects. |
| `json.geoarrow`  |                                                                                       | `'auto' \| 'none'` | `'auto'` | Controls GeoArrow WKB decoding. `'auto'` decodes `geoarrow.wkb` columns to GeoJSON geometry objects. `'none'` serializes the raw values. |

## JSONPaths

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](../jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
