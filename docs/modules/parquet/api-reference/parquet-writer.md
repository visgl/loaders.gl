import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetWriter

<ParquetDocsTabs active="parquetwriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`ParquetWriter` accepts loaders.gl tables, including Arrow tables, and encodes them through the wasm-backed Parquet writer path.

[`ParquetJSWriter`](/docs/modules/parquet/api-reference/parquet-js-writer) is the plain-table writer for the experimental parquetjs backend. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

The legacy `ParquetJSONWriter` compatibility alias has been removed. Use `ParquetWriter`.

```typescript
import {ParquetWriter, ParquetJSWriter} from '@loaders.gl/parquet';
```

## Geospatial Metadata

When `ParquetWriter` receives Arrow input with GeoArrow field metadata, loaders.gl synthesizes GeoParquet `geo` schema metadata when it is missing or invalid.

Writer precedence is:

- valid existing GeoParquet `schema.metadata.geo` is preserved
- missing or invalid GeoParquet metadata is synthesized from GeoArrow field metadata
- geometry columns are passed through unchanged; the writer does not convert between WKB and native GeoArrow layouts in this pass

The writer currently synthesizes:

- `geoarrow.wkb` -> GeoParquet `encoding: "WKB"`
- native GeoArrow single-geometry encodings -> matching GeoParquet encoding names
- `primary_column` from the first geometry column in schema order
- one `columns` entry per detected geometry column
- `crs`, `crs_type`, and `edges` where present on the GeoArrow field metadata

The writer infers `geometry_types` conservatively:

- native single-geometry encodings map to their matching geometry type
- WKB defaults to an empty `geometry_types` array unless more specific information is already available

The writer does not invent `orientation`, `bbox`, `covering`, or `epoch` values. Those fields are only
preserved when existing GeoParquet metadata is already valid.

### Read/Write Example

```typescript
import {load, encode} from '@loaders.gl/core';
import {ParquetLoader, ParquetWriter} from '@loaders.gl/parquet';

const arrowTable = await load(url, ParquetLoader, {
  parquet: {shape: 'arrow-table'}
});

const parquetBuffer = await encode(arrowTable, ParquetWriter, {
  core: {worker: false}
});
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.wasmUrl` | `string` | bundled URL | Overrides the `parquet-wasm` binary URL for `ParquetWriter`. |

## Backend Selection

- Use `ParquetWriter` for the default wasm-backed plain-table writer.
- Use `ParquetJSWriter` for the experimental parquetjs plain-table writer.

## Supported Files

The Parquet format supports a large set of features (data types, encodings, compressions, encryptions etc) it require time and contributions for the loaders.gl implementation to provide support for all variations.

Please refer to the detailed information about which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.
