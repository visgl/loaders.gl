Arrow JavaScript guide

# A typed table shape for JavaScript.

Apache Arrow JS gives applications a binary columnar representation for tables, vectors, record batches, schemas, and zero-copy-friendly data movement. loaders.gl uses it as a common boundary across formats and runtimes.

[Arrow in loaders.gl](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Working with tables](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)[API reference](https://loaders.gl/next/docs/arrowjs/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference.md)

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

Inside an Arrow table

## Tables are columns, batches, and buffers.

The JavaScript API exposes the same columnar structure that makes Arrow efficient: a schema describes fields, vectors hold typed values, and buffers carry the bytes.

### Schema

fields

metadata

Field

name

Type

nullable

metadata

Field

name

Type

nullable

metadata

Field

name

Type

nullable

metadata

### Table

Vector

Vector

Vector

RecordBatch

Data

Data

Data

RecordBatch

Data

Data

Data

RecordBatch

Data

Data

Data

### Vector

Vector

type

length

stride

data

Data

Data

Data

...

### Data buffers

Data

type

length

nullCount

offset

buffers

validity

offsets

values

childData

Data

Data

...

### Data type

DataType

typeId

ArrayType

OffsetArrayType

params

bitWidth

precision

unit

...

children

Field

Field

Field

...

The application can stay at the table boundary; these lower-level objects matter when inspecting schemas, building zero-copy views, or implementing an adapter.

Start with the data shape

## Use columns when the next operation is column-shaped.

Arrow keeps values typed and grouped by column while still supporting row access, batches, schemas, and nested data. It is a useful interchange boundary, not a requirement for every application.

01

Table

A chunked collection of named, typed columns

02

Vector

A logical column view over one or more data chunks

03

RecordBatch

A row-aligned group of columns for streaming

04

Schema

Field names, types, nullability, and metadata

Detailed guide

## Arrow JS concepts and APIs

The sections and linked guides below cover installation, table access, builders, data types, streaming readers and writers, and the loaders.gl Mesh Arrow convention.

Apache Arrow JS provides the JavaScript API for reading, writing, and inspecting Arrow's binary columnar representation. Its core objects cover tables, vectors, schemas, record batches, and the builders and readers that move data between JavaScript and Arrow buffers.

## Choose a path[​](#choose-a-path "Direct link to Choose a path")

| If you need to…                         | Start here                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Install Arrow and create a first table  | [Getting started](https://loaders.gl/next/docs/arrowjs/get-started.md)                             |
| Understand tables, vectors, and buffers | [Introduction](https://loaders.gl/next/docs/arrowjs/developer-guide/introduction.md)               |
| Build or transform typed data           | [Builders](https://loaders.gl/next/docs/arrowjs/developer-guide/builders.md)                       |
| Read or write Arrow IPC                 | [Reading and writing](https://loaders.gl/next/docs/arrowjs/developer-guide/reading-and-writing.md) |
| Use Arrow across loaders.gl formats     | [Arrow in loaders.gl](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)                |

## What Arrow contributes[​](#what-arrow-contributes "Direct link to What Arrow contributes")

Arrow defines a shared physical layout for typed vectors and table-like containers, including flat, variable-width, and nested data. Keeping values in columns makes selective access and vectorized processing practical, while shared buffers make handoffs between libraries less expensive.

In loaders.gl, Arrow JS is the implementation behind the Arrow table boundary. A CSV, Parquet, or GeoArrow loader can produce data that follows the same table and batch conventions, so downstream code does not need to know which file format was decoded.

## Resources[​](#resources "Direct link to Resources")

These resources provide background on the format and practical examples:

* Observable: [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)
* Observable: [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@randomfractals/apache-arrow)
* Observable: [Manipulating Flat Arrays, Arrow-Style](https://observablehq.com/@lmeyerov/manipulating-flat-arrays-arrow-style)
* [Manipulating Flat Arrays](https://observablehq.com/@mbostock/manipulating-flat-arrays) General article on Columnar Data and Data Frames

Apache Arrow project links:

* [Apache Arrow Home](https://arrow.apache.org/)
* [Apache Arrow JS on github](https://github.com/apache/arrow/tree/master/js)
* [Apache Arrow JS on npm](https://www.npmjs.com/package/apache-arrow)

## Why this reference lives here[​](#why-this-reference-lives-here "Direct link to Why this reference lives here")

The official [Arrow JS documentation](https://arrow.apache.org/docs/js/) is the authority for the library. This guide adds the context that is most relevant to loaders.gl: how Arrow objects map to the loader category model, how batches move through workers, and where conversion belongs.

Use the API reference for individual classes and this guide for the route through them. If a detail describes Arrow itself rather than loaders.gl integration, follow the Apache project links above.
