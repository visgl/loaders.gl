Binary columnar format

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# Apache Arrow

A typed table representation that keeps data compact, shareable, and ready for the next step in a JavaScript pipeline.

typed columnszero-copyArrow IPC

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[Try Arrow](https://loaders.gl/next/examples/table/arrow)

<!-- -->

[ ↗](https://loaders.gl/next/examples/table/arrow)

## Try a selective read[​](#try-a-selective-read "Direct link to Try a selective read")

Use the panel below to inspect Arrow IPC metadata, choose columns, and limit the rows returned from a remote table. The same source contract is used by the broader scan architecture.

Arrow IPC URLhttps\://raw\.githubusercontent.com/visgl/loaders.gl/master/modules/tables/test/arrow/data/arrow/simple.arrow

**Arrow scan parameters**Discovering schema…

Reading source metadata before opening the data…

![](/next/images/format-logos/apache-arrow-logo.png)[Try It](https://loaders.gl/next/examples/table/arrow)[Overview](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Format](https://loaders.gl/next/docs/modules/tables/arrow/format.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[GeoArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader.md)

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

Why Arrow is useful

## Decode once. Reuse the table.

Arrow gives loaders, transforms, workers, and renderers a common binary shape. The file format is only the first boundary; the in-memory table is the part your application can keep reusing.

01

Storage

Columns are typed and laid out for efficient access

02

Transport

IPC messages can stream or cross worker boundaries

03

Interop

The same table model is shared across languages

04

Loaders.gl

ArrowLoader, ArrowWriter, and GeoArrow utilities

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

Apache Arrow is a language-independent binary columnar memory format for table-like data. It enables efficient sharing between systems and languages with minimal copying.

* *[`@loaders.gl/tables/arrow`](https://loaders.gl/next/docs/modules/tables/arrow.md)* - loaders.gl implementation
* *[Apache Arrow](https://arrow.apache.org/)* - Apache Arrow project
* *[Arrow JS](https://arrow.apache.org/docs/js)* - official Apache Arrow JS documentation
* *[Arrow JS](https://loaders.gl/next/docs/arrowjs.md)* - loaders.gl Arrow JS API reference

## About Apache Arrow[​](#about-apache-arrow "Direct link to About Apache Arrow")

The Apache Arrow project specifies a binary columnar memory format for flat and nested data. It supports zero-copy shared memory, streaming messages, interprocess communication, and efficient integration with data libraries.

Arrow stores values by column rather than by row. This layout improves cache locality and enables vectorized operations, SIMD processing, and efficient transfer to runtimes that understand Arrow memory.

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

## Arrow JS[​](#arrow-js "Direct link to Arrow JS")

`@loaders.gl/tables/arrow` uses Apache Arrow JS for IPC parsing, writing, and table access. The loaders.gl wrapper adds loader metadata, worker integration, table shape conversion, and utilities for common Arrow table workflows.

## Scan support[​](#scan-support "Direct link to Scan support")

The scan badge means this format has a working entry point in the [common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md). Arrow is both a transport format and the result representation used by the tabular scan adapters.

| Capability                      | In-memory Arrow table                                | Arrow IPC source                     |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| Entry point                     | `query()` or `read()`                                | `read()`                             |
| Schema discovery                | Available immediately                                | Available from IPC metadata          |
| Predicate                       | Portable predicate execution                         | Rejected as unsupported              |
| Projection                      | ✅ Supported                                         | Pushdown                             |
| Limit                           | ✅ Supported                                         | Global limit across batches          |
| Streaming and cancellation      | Materialized result                                  | Streaming Arrow batches; cancellable |
| Additional relational operators | Expressions, ordering, aggregates, unions, and joins | Not part of the IPC source contract  |

Predicate columns may be omitted from the final projection. The predicate is evaluated before projection, and the global limit counts only rows that survive filtering.

## Related Formats[​](#related-formats "Direct link to Related Formats")

[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md) is not a separate file format. It defines geospatial conventions for Arrow extension metadata and geometry column layout.
