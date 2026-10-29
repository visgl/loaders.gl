Parquet module · geospatial loader

GeoParquet

# GeoParquetLoader

Read GeoParquet files into Arrow tables by default while preserving the metadata that describes geometry columns, coordinate systems, and encodings.

[GeoParquet format](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[Parquet module](https://loaders.gl/next/docs/modules/tables/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet.md)

⛶⛶ Explore fullscreen

GeoParquet[Try It](https://loaders.gl/next/examples/geospatial/geoparquet)[Overview](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Format](https://loaders.gl/next/docs/modules/tables/parquet/format.md)[GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[GeoParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/geoparquet-loader.md)[ParquetWriter](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

What it preserves

## Keep the table and the spatial meaning together.

GeoParquetLoader exposes the data in a familiar table shape while carrying GeoParquet and GeoArrow metadata through the read boundary.

01

Default

Arrow table with geospatial metadata

02

Rows

Object-row table with parquet.shape: 'object-row-table'

03

Geometry

Supported encodings mapped to GeoArrow fields

04

Metadata

GeoParquet schema metadata preserved

Detailed guide

## GeoParquetLoader reference

The sections below document usage, output shapes, metadata handling, and Parquet options.

`GeoParquetLoader` loads GeoParquet files into loaders.gl `ArrowTable` objects by default. Set `parquet.shape: 'object-row-table'` when row-oriented output is required.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {GeoParquetLoader} from '@loaders.gl/tables/parquet';



const arrowTable = await load(url, GeoParquetLoader);

const rowTable = await load(url, GeoParquetLoader, {

  parquet: {shape: 'object-row-table'}

});
```

## Shapes[​](#shapes "Direct link to Shapes")

| Shape              | Output                                           |
| ------------------ | ------------------------------------------------ |
| `object-row-table` | loaders.gl object-row table                      |
| `arrow-table`      | loaders.gl `ArrowTable` with geospatial metadata |

## Geospatial Metadata[​](#geospatial-metadata "Direct link to Geospatial Metadata")

When loading Arrow output, `GeoParquetLoader` preserves GeoParquet schema metadata and annotates compatible geometry fields with GeoArrow field metadata. Geometry column buffers are passed through unchanged.

For GeoJSON output, geometry columns are converted to GeoJSON geometries where supported.

## Options[​](#options "Direct link to Options")

`GeoParquetLoader` supports the same options as [`ParquetLoader`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md).
