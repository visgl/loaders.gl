import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';

# JSONWriter

<JsonDocsTabs active="jsonwriter" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

`JSONWriter` writes loaders.gl tables as JSON text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Table} from '@loaders.gl/schema';
import {JSONWriter} from '@loaders.gl/json';

declare const table: Table;

const data = await encode(table, JSONWriter); // ArrayBuffer
const text = JSONWriter.encodeTextSync(table, {json: options}); // string
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

## Data Format

Encoded batches are array buffers or strings.

## JSONWriter Options

| Option          | Type                                            | Default              | Description                                                                                                                                      |
| --------------- | ----------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `json.shape`    | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'object-row-table'` | Requested JSON row shape. `'arrow-table'` is accepted for Arrow table inputs and serializes rows as objects.                                      |
| `json.geoarrow` | `'auto' \| 'none'`                              | `'auto'`             | Controls GeoArrow WKB decoding. `'auto'` decodes `geoarrow.wkb` columns to GeoJSON geometry objects. `'none'` serializes the raw values.          |
| `json.wrapper`  | `(table: RowObject[] \| RowArray[]) => unknown` |                      | Wraps the encoded table rows in a custom JSON value.                                                                                             |
