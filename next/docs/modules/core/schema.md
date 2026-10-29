Schema module

# Give loaders a common shape to return.

`@loaders.gl/core/schema` defines the lightweight table, schema, and batch contracts used across loaders.gl. It follows the parts of Apache Arrow that applications need for portable category data.

[Schema APIs](https://loaders.gl/next/docs/modules/core/schema/table-guide.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema/table-guide.md)[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The table contract

## Keep the shape explicit as the format changes.

A table result tells the application where its rows, columns, schema, and batches live. The source format can change without making every consumer guess what it received.

Compatible inputs

**Rows**objects or arrays

**Columns**typed array-like values

[**Arrow**vectors and record batches↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[**Features**geometry plus properties↗](https://loaders.gl/next/docs/specifications/category-gis.md)

declar&#x65;**→**

shape

Table contract

schemadatabatch

explicit discriminant · stable handoff

us&#x65;**→**

Application paths

**Render**application or GPU path

[**Scan**filter, project, and limit↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[**Convert**move between category shapes↗](https://loaders.gl/next/docs/developer-guide/converting-data.md)[**Write**encode another format↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

Use the lightweight schema boundary for package interoperability; use full Arrow objects when the next operation needs columnar execution or IPC.

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[Arrow​Loader↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[CSV​Loader↗](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[Excel​Loader↗](https://loaders.gl/next/docs/modules/tables/excel/api-reference/excel-loader.md)[JSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[NDJSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[Parquet​Loader↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

Data

[Arrow table datashape: 'arrow-table'↗](https://loaders.gl/next/docs/specifications/category-table.md)

Encode

[Arrow​Writer↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[Parquet​Writer↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

The data-shape boundary

## Decode many formats. Keep the application path stable.

Schema types describe how a loader’s result is organized, without forcing every format to use the same physical representation. Applications can choose row, columnar, wrapped, or Arrow-backed shapes where supported.

01

Table

Rows, columns, schema, and optional metadata

02

Schema

Field names, types, and nested structure

03

Batch

A bounded unit of records or category data

04

Interop

Arrow-compatible shapes across loaders and writers

Detailed guide

## Tables, batches, and shape selection

The sections below cover table APIs, runtime shape detection, loader shape options, and the category data contracts used by applications.

## What the module provides[​](#what-the-module-provides "Direct link to What the module provides")

### Geospatial metadata validation[​](#geospatial-metadata-validation "Direct link to Geospatial metadata validation")

Geometry/GeoParquet metadata types and dependency-light metadata helpers are available from the root. Runtime validators are isolated in `@loaders.gl/core/schema/geospatial-metadata-zod-schema`, so importing the root does not load Zod. The subpath exports `GeoArrowMetadataSchema`, `GeoParquetMetadataSchema`, `GeoParquetColumnMetadataSchema` and `GeoParquetGeometryTypeSchema`.

Generated schemas are available at `@loaders.gl/core/schema/geoparquet.schema.json` and `@loaders.gl/core/schema/geoarrow-metadata.schema.json`. The old GIS subpaths remain compatibility entry points.

The schema module is the small contract shared by loaders, sources, converters, and writers. It describes the data shape without taking ownership of the format-specific decoder.

* [`Schema`](https://loaders.gl/next/docs/modules/core/schema/api-reference/schema.md) describes named fields, types, nullability, and metadata.
* [`Table`](https://loaders.gl/next/docs/modules/core/schema/api-reference/table.md) describes a complete result in a row, columnar, GeoJSON, or Arrow representation.
* [`Batch`](https://loaders.gl/next/docs/modules/core/schema/api-reference/table-batch.md) describes one bounded result from an incremental loader or source.

The types are deliberately serializable and Arrow-aligned. Applications can use the lightweight schema types at package boundaries, then convert to full Apache Arrow objects when they need Arrow execution or IPC.

## Choose a table shape[​](#choose-a-table-shape "Direct link to Choose a table shape")

| Shape              | Use it when                                            | Data location                         |
| ------------------ | ------------------------------------------------------ | ------------------------------------- |
| `array-row-table`  | Rows are easiest to pass through application code      | `data` is an array of value arrays    |
| `object-row-table` | Fields should be addressed by name                     | `data` is an array of objects         |
| `geojson-table`    | The result needs GeoJSON feature compatibility         | `features` contains the rows          |
| `columnar-table`   | Typed columns are useful but Arrow is not required     | `data` is a map of array-like columns |
| `arrow-table`      | The next step is columnar processing, scanning, or IPC | `data` contains an Apache Arrow table |

Every wrapped result uses `shape` as its discriminant, so application code can select the correct branch without guessing from the payload:

```
function getRowCount(table: Table): number {

  switch (table.shape) {

    case 'geojson-table':

      return table.features.length;

    case 'arrow-table':

      return table.data.numRows;

    default:

      return table.data.length;

  }

}
```

## Shapes in loaders[​](#shapes-in-loaders "Direct link to Shapes in loaders")

When a loader supports multiple representations, the option belongs to that loader's namespace. The exact choices vary by format, but the result keeps the same explicit `shape` boundary:

```
const table = await load(url, MVTLoader, {

  mvt: {shape: 'geojson-table'}

});



if (table.shape === 'geojson-table') {

  renderFeatures(table.features);

}
```

For batch-oriented APIs, the same category names describe each batch. That makes it possible to start with `load()` for a complete result and move to `loadInBatches()` or a source without redesigning the consumer.

## Table APIs[​](#table-apis "Direct link to Table APIs")

The table API is modelled after a focused subset of the Apache Arrow API:

| loaders.gl type                                                                               | Arrow counterpart | Role                           |
| --------------------------------------------------------------------------------------------- | ----------------- | ------------------------------ |
| [`Table`](https://loaders.gl/next/docs/modules/core/schema/api-reference/table.md)       | `Table`           | Complete table result          |
| [`Schema`](https://loaders.gl/next/docs/modules/core/schema/api-reference/schema.md)     | `Schema`          | Field and metadata description |
| [`Batch`](https://loaders.gl/next/docs/modules/core/schema/api-reference/table-batch.md) | `RecordBatch`     | Bounded incremental result     |

Use the [table guide](https://loaders.gl/next/docs/modules/core/schema/table-guide.md) for the longer explanation of row and columnar representations, or continue to the [Apache Arrow interoperability page](https://loaders.gl/next/docs/modules/core/schema/api-reference/apache-arrow.md) when the physical memory layout matters.
