Common data plane

# Many data formats. One table shape.

Use Apache Arrow as a fast, typed in-memory representation between loaders, applications, workers, and writers.

typed columnszero-copyArrow IPC

The common data plane

## Many inputs. One typed table boundary.

The file format stays specialized at the edges. Arrow is the shared shape in the middle, where loaders, scans, workers, renderers, and writers can exchange columns and batches.

Format-specific input

[Parquetcolumns and row groups↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[CSV / JSONLstreamed records↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[Geo formatsfeatures and geometry columns↗](https://loaders.gl/next/docs/specifications/category-gis.md)[Arrow IPCfile or stream↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

→

↔

Apache Arrow

schema · vectors · record batches

→

Application work

[Scanfilter and project↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Workerstransfer buffers↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Rendertables and geometry↗](https://loaders.gl/next/docs/specifications/category-table.md)[WriteIPC or another format↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

Keep the representation stable while the source, execution engine, or destination changes.

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

A common data plane

## Use one typed table shape between formats.

Arrow keeps columns typed and contiguous as data moves between loaders, workers, applications, and writers. It is useful when the next step should not care which file format came first.

01

Use it when

Several formats feed the same table processing path

02

Core representation

Typed columns, record batches, and tables

03

Useful properties

Binary layout, zero-copy views, and shared schemas

04

Packages

@loaders.gl/tables/arrow, @loaders.gl/core/geoarrow, and @loaders.gl/tables/parquet

## Start here[​](#start-here "Direct link to Start here")

Apache Arrow gives different tabular formats a shared, typed columnar shape. Use it when you want efficient transfer or the same processing code across formats; loaders that return other shapes do not require it.

loaders.gl uses Apache Arrow as a standard in-memory representation of tables.

loaders.gl provides an `ArrowLoader` and an `ArrowWriter` that load and write Arrow files.

An increasing subset of tabular loaders can parse various formats directly into in-memory Arrow tables, and writers can write in-memory Arrow tables to those formats.

Detailed guide

## The representation details

The sections below cover the Arrow JS dependency, supported versions, installation, and compatibility troubleshooting.

## Apache Arrow JS library[​](#apache-arrow-js-library "Direct link to Apache Arrow JS library")

To work effectively with in-memory Apache Arrow data, a library is needed, and loaders.gl integrates with the official Apache Arrow JS `apache-arrow` package.

A subset of modules that import the Apache Arrow JS library:

* `@loaders.gl/tables/arrow`
* `@loaders.gl/core/geoarrow`
* `@loaders.gl/tables/parquet`
* `@loaders.gl/core/schema`
* `@loaders.gl/core/schema-utils`

### Apache Arrow JS versions[​](#apache-arrow-js-versions "Direct link to Apache Arrow JS versions")

Currently, all loaders.gl modules that use Apache Arrow are designed to work with:

* `apache-arrow: ">= 17.0.0"`

These semver specifications are designed to deduplicate: if the application specifies an `apache-arrow` version that satisfies the version condition, all the loaders.gl modules should be linked with that library. This allows applications to control which Arrow version they want to have installed by adding a specific version to their own package.json `dependencies` section.

Note that future loaders.gl versions may drop support for older versions if compatibility issues require it.

With a clean install (`rm -rf node_modules package-lock.json yarn.lock` and reinstall), the latest version of `apache-arrow` is automatically installed.

You may still want to specify `apache-arrow` explicitly in your app to avoid being pinned down by lock files etc.

### Recommended install pattern[​](#recommended-install-pattern "Direct link to Recommended install pattern")

```
npm install apache-arrow @loaders.gl/core @loaders.gl/tables

# plus any other loaders you use
```

or:

```
yarn add apache-arrow @loaders.gl/core @loaders.gl/tables
```

### Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

If you suspect version conflicts or duplicate apache-arrow versions in your application:

* Add `apache-arrow` as an explicitly top-level dependency in your app
* Try a clean reinstall after lockfile cleanup
* Align dependent packages to the same major/minor family of Arrow where possible

Most package managers have a way to check a dependency:

```
$ yarn why apache-arrow

├─ @loaders.gl/tables@workspace:modules/tables

│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)

│

└─ @loaders.gl/core@workspace:modules/core

   └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
```
