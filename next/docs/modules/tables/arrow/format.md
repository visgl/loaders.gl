Binary columnar data

![](/next/images/format-logos/apache-arrow-logo.png)

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# Apache Arrow

Apache Arrow keeps columns typed and contiguous as they move between decoders, scanners, workers, analytical code, and writers. loaders.gl provides the format adapters and common table contracts around that physical model.

[Arrow overview](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[Binary columnar guide](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

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

Why Arrow is the common shape

## Decode once. Reuse the columns.

Arrow is useful when data crosses more than one boundary. The same typed buffers can feed a table view, a scan predicate, a worker, a geometry adapter, or a writer without first becoming a large object-row copy.

01

Physical model

Typed, contiguous buffers with explicit validity and offsets.

02

Application shape

Tables and geometry tables shared across related formats.

03

Pipeline fit

Works with batches, range reads, workers, transforms, and writers.

04

Format boundary

Arrow IPC and GeoArrow metadata remain standards-shaped.

Detailed guide

## Arrow module details

The reference below lists the loaders, writers, IPC behavior, metadata, and related GeoArrow paths exposed by the module.

| Characteristic       | Value                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [Apache Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)                                                                           |
| Related Format       | [GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)                                                                            |
| Data Format          | [Tables](https://loaders.gl/next/docs/specifications/category-table.md), [Geometry Tables](https://loaders.gl/next/docs/specifications/category-gis.md) |
| File Extensions      | `.arrow`, `.feather`                                                                                                                                              |
| MIME Types           | `application/vnd.apache.arrow.file`, `application/vnd.apache.arrow.stream`                                                                                        |
| File Type            | Binary                                                                                                                                                            |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                                                                                                    |
| Loader Worker Thread | ✅ Yes                                                                                                                                                            |
| Loader Streaming     | ✅ Yes                                                                                                                                                            |
| Writer APIs          | `encode`, `encodeSync`                                                                                                                                            |

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**ArrowLoader**Loads Apache Arrow IPC files and streams as loaders.gl tables.Output: ArrowTable, table shapesAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader)[Loader**GeoArrowLoader**Loads Arrow data and interprets GeoArrow geometry columns.Output: Geometry tableAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader)[Writer**ArrowWriter**Writes arrays as Apache Arrow IPC data.Input: arraysAPIs: encode, encodeSync](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer)

## IPC[​](#ipc "Direct link to IPC")

`ArrowLoader` reads Apache Arrow IPC file and stream data. IPC streams can be parsed in batches with `parseInBatches`.

Feather V2 is the Arrow IPC file format with a `.feather` extension. Feather V1 is a different legacy format and is not supported.

### Format capabilities[​](#format-capabilities "Direct link to Format capabilities")

| Capability                                                     | Arrow IPC stream | Arrow IPC file | Feather V2 | Feather V1 |
| -------------------------------------------------------------- | ---------------- | -------------- | ---------- | ---------- |
| Decode complete table                                          | ✅               | ✅             | ✅         | ✕          |
| Decode record batches                                          | ✅               | ✅             | ✅         | ✕          |
| Decode in a worker                                             | ✅               | ✅             | ✅         | ✕          |
| Decode uncompressed data with Apache Arrow JS 17+              | ✅               | ✅             | ✅         | ✕          |
| Decode LZ4-frame buffer compression with Apache Arrow JS 21.2+ | ✅               | ✅             | ✅         | ✕          |
| Decode Zstandard buffer compression with Apache Arrow JS 21.2+ | ✅               | ✅             | ✅         | ✕          |
| Encode with `ArrowWriter`                                      | ✅               | ✅             | ✅         | ✕          |
| Encode LZ4-frame buffer compression with Apache Arrow JS 21.2+ | ✅               | ✅             | ✅         | ✕          |
| Encode Zstandard buffer compression with Apache Arrow JS 21.2+ | ✅¹              | ✅¹            | ✅¹        | ✕          |

¹ Zstandard encoding uses asynchronous `encode()` so its codec can be initialized. LZ4 and uncompressed output support both `encode()` and `encodeSync()`.

### Embedded compression[​](#embedded-compression "Direct link to Embedded compression")

Arrow IPC defines exactly two embedded record-batch buffer compression codecs. `ArrowLoader` supports both:

| Codec                   | Decode | Encode | Notes                                          |
| ----------------------- | ------ | ------ | ---------------------------------------------- |
| LZ4 Frame (`LZ4_FRAME`) | ✅     | ✅     | Each compressed buffer contains one LZ4 frame. |
| Zstandard (`ZSTD`)      | ✅     | ✅¹    | Standard Zstandard frame compression.          |

Individual buffers that a Feather writer leaves uncompressed because compression would not reduce their size are also supported. The codecs are registered only when the installed Apache Arrow JS runtime exposes IPC compression support (version 21.2.0 or later). Apache Arrow JS 17 through 21.1 remain supported for uncompressed IPC data and report a targeted version requirement when a compressed record batch is encountered.

## GeoArrow[​](#geoarrow "Direct link to GeoArrow")

GeoArrow data is valid Apache Arrow data with geospatial extension metadata and geometry column layouts. Use `GeoArrowLoader` when you want loaders.gl to interpret GeoArrow geometry columns.
