# @loaders.gl/parquet 🚧

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Experimental loader and writer for the Apache Parquet format.

- `ParquetLoader` and `ParquetWriter` are the default wasm-backed plain-row APIs.
- [`ParquetJSLoader`](/docs/modules/parquet/api-reference/parquet-js-loader) and [`ParquetJSWriter`](/docs/modules/parquet/api-reference/parquet-js-writer) provide the experimental parquetjs plain-row and plain-table APIs. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- `ParquetArrowLoader` and `ParquetArrowWriter` remain the wasm-backed Arrow-first APIs.

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
- Documentation was inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.

# License

`@loaders.gl/parquet` module is based on Apache 2.0 licensed code.
