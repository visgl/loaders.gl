import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetWriter

<ParquetDocsTabs active="parquetwriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`ParquetWriter` accepts loaders.gl tables, including Arrow tables, and encodes them through the wasm-backed Parquet writer path.

`ParquetJSWriter` is the plain-table writer for the experimental TypeScript parquetjs backend.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

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
- inline `crs` and non-planar `edges` where present on the GeoArrow field metadata

The writer infers `geometry_types` conservatively:

- native single-geometry encodings map to their matching geometry type
- WKB defaults to an empty `geometry_types` array unless more specific information is already available

The writer does not invent `orientation`, `bbox`, `covering`, or `epoch` values. Those fields are only
preserved when existing GeoParquet metadata is already valid.

### GeoParquet 2.0 with the TypeScript writer

When valid `geo` metadata declares version 2.x and a binary column with `encoding: "WKB"`,
`ParquetJSWriter` writes that column as the native Parquet `GEOMETRY` logical type for planar edges
or `GEOGRAPHY` for spherical, Vincenty, Thomas, Andoyer, or Karney edges. It carries inline
PROJJSON into the logical type, uses Parquet's default `OGC:CRS84` when CRS is omitted, and writes
`srid:0` when GeoParquet explicitly declares `crs: null`.

Every row group receives native `GeospatialStatistics`: a bounding box with independent X, Y, Z,
and M handling plus the unique ISO WKB codes for XY, XYZ, XYM, and XYZM geometry families.

Without GeoParquet `geo` metadata, a `geoarrow.wkb` field is still written using native Parquet
geospatial types. GeoArrow inline or authority-code CRS values are carried directly; an omitted
GeoArrow CRS means unknown and is written as `srid:0`, rather than being silently changed to the
Parquet default CRS84.

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

### TypeScript writer options

`ParquetJSWriter` accepts `parquet.columnEncodings`, keyed by top-level column name. It also supports
adaptive or forced chunk dictionaries independently of the primary encoding. Unsupported
encoding/type combinations and unknown column names are rejected instead of silently falling back.

```typescript
const parquet = await encode(table, ParquetJSWriter, {
  parquet: {
    useDataPageV2: true,
    pageSize: 8192,
    dictionary: 'auto',
    columnDictionaries: {
      identifier: false
    },
    columnEncodings: {
      temperature: 'BYTE_STREAM_SPLIT',
      timestamp: 'DELTA_BINARY_PACKED',
      identifier: 'DELTA_BYTE_ARRAY'
    },
    bloomFilter: {identifier: true},
    pageIndex: {timestamp: true}
  }
});
```

The selectable primary encodings are:

| Encoding | Physical types | Typical data |
| -------- | -------------- | ------------ |
| `PLAIN` | All | Baseline or already-compressed values |
| `BYTE_STREAM_SPLIT` | `INT32`, `INT64`, `FLOAT`, `DOUBLE`, `FIXED_LEN_BYTE_ARRAY` | Fixed-width numeric values followed by compression |
| `DELTA_BINARY_PACKED` | `INT32`, `INT64` | Ordered counters, timestamps, and low-delta integers |
| `DELTA_LENGTH_BYTE_ARRAY` | `BYTE_ARRAY` | Variable-width values with compressible lengths |
| `DELTA_BYTE_ARRAY` | `BYTE_ARRAY`, `FIXED_LEN_BYTE_ARRAY` | Sorted or shared-prefix strings and binary values |

Dictionary encoding is configured separately because it emits a PLAIN dictionary page followed by
`RLE_DICTIONARY` data pages. `dictionary: 'auto'` uses a dictionary only when its uncompressed value
payload plus index stream are smaller than the selected primary encoding. `dictionary: true` forces
one when it fits the size limit, and `false` disables it. If a forced dictionary exceeds
`dictionaryPageSizeLimit`, the complete column chunk uses its primary encoding instead of mixing
incompatible dictionary domains.

See the [Parquet format page](/docs/modules/parquet/formats/parquet#value-encodings) for the complete
read/write encoding matrix.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.wasmUrl` | `string` | bundled URL | Overrides the `parquet-wasm` binary URL for `ParquetWriter`. |
| `parquet.columnEncodings` | `Record<string, ParquetJSWriterEncoding>` | `{}` | Selects the primary value encoding by top-level column name for `ParquetJSWriter`. |
| `parquet.dictionary` | `boolean \| 'auto'` | `'auto'` | Enables, disables, or adaptively selects a chunk-wide dictionary. |
| `parquet.columnDictionaries` | `Record<string, boolean \| 'auto'>` | `{}` | Overrides the dictionary policy by top-level column name. |
| `parquet.dictionaryPageSizeLimit` | `number` | `1048576` | Maximum uncompressed PLAIN dictionary payload in bytes; oversized dictionaries fall back for the complete chunk. |
| `parquet.bloomFilter` | `boolean \| Record<string, boolean>` | `false` | Emits uncompressed split-block Bloom filters for supported scalar columns, globally or by top-level column name. |
| `parquet.pageIndex` | `boolean \| Record<string, boolean>` | `false` | Emits column and offset indexes for supported non-repeated scalar columns, globally or by top-level column name. |
| `parquet.rowGroupSize` | `number` | implementation default | Sets the target row count per row group for `ParquetJSWriter`. |
| `parquet.pageSize` | `number` | `8192` | Sets the target shredded level-entry count per page. Boundaries remain aligned to top-level rows. |
| `parquet.useDataPageV2` | `boolean` | `false` | Emits Data Page V2 from `ParquetJSWriter`. |

## Writer Variants

- Use `ParquetWriter` for the default wasm-backed plain-table writer.
- Use `ParquetJSWriter` for the experimental TypeScript parquetjs plain-table writer. It accepts
  plain loaders.gl tables and does not require Arrow input.

```typescript
import {encode} from '@loaders.gl/core';
import {ParquetJSWriter} from '@loaders.gl/parquet';

const parquetBuffer = await encode(table, ParquetJSWriter, {
  core: {worker: false},
  parquet: {
    rowGroupSize: 1000
  }
});
```

`ParquetJSWriter` emits multiple pages when a column chunk exceeds `parquet.pageSize`. A repeated row
larger than the target stays intact in one page. Dictionary pages are shared by all data pages in a
column chunk, and footer offsets plus encoding statistics identify the dictionary and data-page
regions for other readers.

The TypeScript writer emits Parquet 2.13 `LogicalType` metadata for Arrow-compatible integer,
date/time/timestamp, decimal, FLOAT16, and string fields. Nanosecond and unsigned 64-bit values are
written without conversion through JavaScript `number`.

## Supported Files

The Parquet format supports a large set of features (data types, encodings, compressions, encryptions etc) it require time and contributions for the loaders.gl implementation to provide support for all variations.

Please refer to the detailed information about which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.
