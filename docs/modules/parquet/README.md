# @loaders.gl/parquet 🚧

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Experimental loader and writer for the Apache Parquet format.

- `ParquetLoader` and `ParquetWriter` are the default wasm-backed plain-row APIs.
- [`ParquetSourceLoader`](/docs/modules/parquet/api-reference/parquet-source-loader) provides reusable, selective Arrow reads with cached schema and footer metadata. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`ParquetDatasetSource`](/docs/modules/parquet/api-reference/parquet-source-loader#multi-file-datasets) coordinates catalog-backed, multi-file Parquet reads with file pruning and bounded concurrency. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- `ParquetJSLoader` and `ParquetJSWriter` provide experimental TypeScript parquetjs variants documented with [`ParquetLoader`](/docs/modules/parquet/api-reference/parquet-loader#loader-variants) and [`ParquetWriter`](/docs/modules/parquet/api-reference/parquet-writer#writer-variants). <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- `ParquetLoader` supports Arrow output with `parquet.shape: 'arrow-table'`, and `ParquetWriter` accepts loaders.gl Arrow tables.
- [`IcebergTableSource`](/docs/modules/parquet/api-reference/iceberg-table-source) provides read-only
  Iceberg metadata and manifest planning, dispatching selected Parquet files through the existing
  range-aware dataset reader.
- `DeltaSourceLoader` provides metadata-only loader discovery for read-only Delta snapshots.
  Import `DeltaTableSource` from the explicit `@loaders.gl/parquet/delta-source` subpath to replay
  newline-delimited transaction logs and dispatch active Parquet files through the same dataset
  reader.

## Geospatial Metadata

GeoParquet and GeoArrow metadata are handled as two parallel layers:

- GeoParquet `schema.metadata.geo` is preserved as schema/file metadata
- GeoArrow field metadata is added to geometry columns when it can be derived safely

On read, geometry columns are passed through unchanged while loaders.gl maps supported GeoParquet
geometry encodings onto field-level GeoArrow metadata.

On write, GeoArrow field metadata can be used to synthesize missing or invalid GeoParquet `geo`
metadata before Parquet encoding.

# Attribution

- Based on a fork of https://github.com/ironSource/parquetjs and https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.).
- Delta decoder improvements include adaptations from https://github.com/hyparam/hyparquet under the MIT license (Copyright (c) Hyperparam contributors).
- Documentation was inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.

# License

`@loaders.gl/parquet` module is based on Apache 2.0 licensed code.
