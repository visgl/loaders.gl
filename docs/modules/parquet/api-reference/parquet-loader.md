import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetLoader

<ParquetDocsTabs active="parquetloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Streaming loader for Apache Parquet encoded files. `ParquetLoader` returns plain JavaScript object rows by default and can return Arrow tables through `parquet.shape: 'arrow-table'`.

[`ParquetJSLoader`](/docs/modules/parquet/api-reference/parquet-js-loader) is the plain-row loader for the experimental parquetjs backend. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

The legacy `ParquetJSONLoader` compatibility alias has been removed. Use `ParquetLoader`.

Please refer to the `parquet` format page for information on
which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.

## Usage

Load a Parquet file as object rows.

```typescript
import {ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const wasmRows = await load(url, ParquetLoader, {parquet: options});
const jsRows = await load(url, ParquetJSLoader, {parquet: options});
```

Load a Parquet file as Arrow using the main loader.

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const arrowTable = await load(url, ParquetLoader, {
  parquet: {
    shape: 'arrow-table'
  }
});
```

## Shapes

`ParquetLoader` returns object-row tables by default. Set `parquet.shape: 'arrow-table'` to return loaders.gl `ArrowTable` objects.

| Shape              | Output                                           |
| ------------------ | ------------------------------------------------ |
| `object-row-table` | loaders.gl row table with objects                |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Arrow table  |

The ParquetLoader supports streaming parsing, in which case it will yield "batches" of rows.

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geo.parquet', ParquetLoader, {parquet: options}});

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

## Geospatial Metadata

When `ParquetLoader` reads a GeoParquet file as Arrow:

- the original GeoParquet `geo` metadata is preserved in `schema.metadata.geo`
- matching geometry fields are annotated with GeoArrow field metadata when that mapping is safe
- geometry columns are passed through unchanged; this loader does not convert WKB to native GeoArrow or vice versa in this path

The loader currently maps:

- GeoParquet `encoding: "WKB"` -> `ARROW:extension:name = "geoarrow.wkb"`
- GeoParquet native single-geometry encodings -> matching GeoArrow extension names:
  - `point`
  - `linestring`
  - `polygon`
  - `multipoint`
  - `multilinestring`
  - `multipolygon`
- `crs`, `crs_type`, and `edges` onto field-level `ARROW:extension:metadata` when present

GeoParquet-only schema metadata such as `version`, `primary_column`, `columns`, `geometry_types`,
`bbox`, `covering`, `orientation`, and `epoch` remains in `schema.metadata.geo` and is not mirrored
into GeoArrow field metadata.

If GeoParquet metadata says a column is geospatial but the physical Arrow field is clearly incompatible
with that encoding, loaders.gl preserves the schema-level `geo` metadata and skips adding misleading
field-level GeoArrow metadata.

## Compressions

Some compressions are big and need to be imported explicitly by the application
and passed to the `ParquetLoader`

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

import {ZstdCodec} from 'zstd-codec';
import lz4js from 'lz4js';

const data = await load(url, ParquetLoader, {modules: {
  'zstd-codec': ZstdCodec,
  'lz4js': lz4js,
  // brotli - only needed for compression
});
```

## Data Format

For details see [parquet documentation](https://parquet.apache.org/docs/).

Unannotated Parquet `BYTE_ARRAY` and `FIXED_LEN_BYTE_ARRAY` columns are returned as
`Uint8Array` values. Logical byte-backed columns are decoded according to the schema,
for example `UTF8` values are returned as JavaScript strings and `JSON` values are
returned as parsed JavaScript values.

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.shape` | `'object-row-table' \| 'arrow-table'` | `'object-row-table'` | Selects the returned table shape for `ParquetLoader`. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> |
| `parquet.limit` | `number` | `undefined` | Maximum number of rows to return. |
| `parquet.offset` | `number` | `0` | Number of rows to skip before returning data. |
| `parquet.batchSize` | `number` | `undefined` | Target number of rows per batch when streaming. |
| `parquet.columns` | `string[]` | `undefined` | Restrict parsing to the listed columns. |
| `parquet.rowGroups` | `number[]` | `undefined` | Restrict reading to the listed row groups for the wasm loader implementations. |
| `parquet.concurrency` | `number` | `undefined` | Controls parallel reads for the wasm loader implementations. |
| `parquet.wasmUrl` | `string` | bundled URL | Overrides the `parquet-wasm` binary URL for `ParquetLoader`. |

## Backend Selection

- Use `ParquetLoader` for the default wasm-backed plain-row loader.
- Use `ParquetJSLoader` for the experimental parquetjs plain-row loader.
