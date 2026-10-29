Module overview

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# @loaders.gl/tables/arrow

Use Apache Arrow as the common table shape between format loaders, workers, transforms, and writers.

typed columnszero-copyArrow IPC

[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)

Arrow IPC URLhttps\://raw\.githubusercontent.com/visgl/loaders.gl/master/modules/tables/test/arrow/data/arrow/simple.arrow

**Arrow scan parameters**Discovering schema…

Reading source metadata before opening the data…

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

The Arrow module

## One binary table shape between every stage.

Use Arrow when a loader, worker, transform, scanner, or writer needs to exchange typed columns without falling back to format-specific row objects.

01

Ingest

Load Arrow IPC and convert compatible formats into tables

02

Compute

Keep typed columns, schemas, and batches explicit

03

Transport

Move buffers across workers with focused helpers

04

Geospatial

Carry GeoArrow geometry columns and metadata

The `@loaders.gl/tables/arrow` module provides support for the [Apache Arrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md) and [GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md) formats.

Detailed guide

## Loaders, writers, and table utilities

The reference below covers installation, Arrow and GeoArrow entry points, transport helpers, indexed views, schema utilities, and the underlying Arrow JS API.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tables
```

See [Using with Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md) for practical guidance on how to integrate with the Apache Arrow JS library.

## Type-only imports[​](#type-only-imports "Direct link to Type-only imports")

Use `@loaders.gl/tables/arrow/types` for types exported by the module and types available in Apache Arrow 17, including classes exported as types:

```
import type {Table, Vector, ArrowLoaderOptions, IndexedArrowTable} from '@loaders.gl/tables/arrow/types';
```

Types added in newer Apache Arrow releases, such as `Utf8View` and `BinaryView`, should be imported directly from the installed `apache-arrow` package.

Type-only imports are erased by TypeScript and add no runtime code or memory cost. The subpath itself emits an empty module with no runtime dependencies. To construct class instances, import their runtime values from `apache-arrow` or `@loaders.gl/tables/arrow`.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer                                                                                             | Description                                                    |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)       | Loads Apache Arrow IPC files and streams as loaders.gl tables. |
| [`ArrowWorkerLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md) | Deprecated alias for `ArrowLoader`.                            |
| [`GeoArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader.md) | Loads Arrow data and interprets GeoArrow geometry columns.     |
| [`ArrowWriter`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)       | Writes arrays as Apache Arrow IPC data.                        |

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

`@loaders.gl/tables/arrow` also provides utilities for working with Apache Arrow JS tables after loading or when integrating Arrow-backed data sources. Arrow worker transport helpers are available from the focused `@loaders.gl/tables/arrow/transport` subpath as well as the root export.

| Utility                                                                                                                                   | Description                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`IndexedArrowTable`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/indexed-arrow-table.md)                        | Readonly indexed table and vector views that avoid copying column data   |
| [`MappedArrowTable`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/mapped-arrow-table.md)                          | String-keyed row lookup view layered on top of an indexed Arrow table    |
| [`splitArrowBuffers`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/split-arrow-buffers.md)                        | Rebuild Arrow objects so sliced buffers can be transferred safely        |
| [`Arrow Table Transport`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-table-transport.md)                  | Dehydrate/hydrate or serialize/deserialize Arrow tables across workers   |
| [`triangulateWKBGeometryColumn`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/triangulate-wkb-geometry-column.md) | Tessellate a GeoArrow WKB geometry column into index and vertex columns  |
| [`Arrow Schema Utilities`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-schema-utils.md)                    | Runtime schema validation and column-renaming helpers                    |
| [`Arrow Variable-Width Conversion`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-variable-width.md)         | Convert Utf8/Binary vectors and tables between standard and view layouts |
| [`UTF-8 Utilities`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/utf8-utils.md)                                   | Compare and parse Arrow UTF-8 byte ranges without decoding strings       |

For the underlying Apache Arrow JS classes, start with the [`ArrowJS API Reference`](https://loaders.gl/next/docs/arrowjs/api-reference.md).

## Attributions[​](#attributions "Direct link to Attributions")

`@loaders.gl/tables/arrow` was developed with the benefit of extensive technical advice from Paul Taylor @ Graphistry.

Arrow IPC LZ4-frame and Zstandard compression use compress-utils. Async parsing and writing initialize the required codecs automatically. For synchronous compressed parsing, call `await ArrowLoader.preload()` and use the returned parser-bearing loader. For synchronous encoding, initialize the requested codec with an async `encode()` first. Application-provided Arrow registry codecs remain supported. No `lz4js`, `fzstd`, or `zstd-codec` injection is required.
