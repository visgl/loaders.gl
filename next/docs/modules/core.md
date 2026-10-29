Core module

# @loaders.gl/core

The public loaders.gl API for loading, parsing, streaming, and encoding data across format modules. Common utilities are available through dedicated subpaths such as core/schema, core/loader-utils, and core/worker-utils.

[Get started](https://loaders.gl/next/docs/developer-guide/get-started.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/get-started.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)[Core API reference](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

The loader boundary

## Formats change. The application path can stay the same.

Choose a loader explicitly when the format is known, or let the selector choose from a compatible set. The result remains the shape your application is built to consume.

Input formats

[**Parquet**columnar table↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**GeoJSON**feature data↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[**glTF / GLB**scenegraph↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[**LAS / LAZ**point cloud↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

selec&#x74;**→**

{ }

Loader selection

explicit · list · registry

retur&#x6E;**→**

Application shapes

[**Table**rows or Arrow columns↗](https://loaders.gl/next/docs/specifications/category-table.md)[**Mesh**positions and attributes↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[**Scenegraph**nodes and materials↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)[**Point cloud**positions and point fields↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

One loader can be precise; a loader list can be flexible; the result contract is still yours.

The core module

## One small API around many format modules.

Core handles fetching, parser selection, loading, streaming, encoding, and saving. Format packages remain optional, so an application can compose only the paths it needs.

01

Fetch

Resolve URLs, files, streams, and request options

02

Select

Choose explicit loaders or detect among candidates

03

Process

Load complete results or iterate through batches

04

Write

Encode and save compatible application data

`@loaders.gl/core` coordinates format loaders and writers. Pass explicit loaders to keep format selection and return types local to your application.

| Task                      | APIs and guidance                                                                                                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fetch and parse           | [`load`](https://loaders.gl/next/docs/modules/core/api-reference/load.md), [`loadInBatches`](https://loaders.gl/next/docs/modules/core/api-reference/load-in-batches.md)                                                                                                |
| Parse loaded data         | [`parse`](https://loaders.gl/next/docs/modules/core/api-reference/parse.md), [`parseSync`](https://loaders.gl/next/docs/modules/core/api-reference/parse-sync.md), [`parseInBatches`](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md) |
| Prepare metadata loaders  | [`preload` and `preloadSync`](https://loaders.gl/next/docs/developer-guide/using-metadata-loaders.md)                                                                                                                                                                        |
| Select a loader           | [`selectLoader` and `selectLoaderSync`](https://loaders.gl/next/docs/modules/core/api-reference/select-loader.md)                                                                                                                                                            |
| Open a runtime source     | [`createDataSource`](https://loaders.gl/next/docs/modules/core/api-reference/create-data-source.md), or async `load` for lazy source loaders                                                                                                                                 |
| Fetch bytes               | [`fetchFile`](https://loaders.gl/next/docs/modules/core/api-reference/fetch-file.md), or the runtime's `fetch`                                                                                                                                                               |
| Encode data               | [`encode`, `encodeText`, and synchronous/batched variants](https://loaders.gl/next/docs/modules/core/api-reference/encode.md)                                                                                                                                                |
| Adapt streams             | [`makeIterator` and `makeStream`](https://loaders.gl/next/docs/modules/core/api-reference/iterator-utilities.md)                                                                                                                                                             |
| Configure shared defaults | [`setLoaderOptions` and `getLoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/set-loader-options.md)                                                                                                                                                   |

`registerLoaders` remains a [deprecated compatibility API](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md). Core does not export `save` or `writeFile`; save encoded bytes with your platform's filesystem, download, or upload API.

Detailed guide

## Core APIs and lightweight entry points

The reference below lists the parser, fetch, loader-selection, encoding, writing, and micro-loader APIs.

## Micro-Loaders[​](#micro-loaders "Direct link to Micro-Loaders")

Loaders with limited functionality but with minimal bundle size impact:

| Loader       | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `JSONLoader` | A minimal non-streaming JSON loader that uses the built-in `JSON.parse` function |
| `NullLoader` | A loader-object that ignores input data and always returns `null`.               |

## Utility subpaths[​](#utility-subpaths "Direct link to Utility subpaths")

Reusable scan, geometry construction, geometry processing, and codec APIs are available through independent subpaths:

| Import                                                                                                    | Utilities                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`@loaders.gl/core/constants`](https://loaders.gl/next/docs/modules/core/api-reference/constants.md) | Branch, repository URL, and worker tag constants.                                                    |
| [`@loaders.gl/core/loader-utils`](https://loaders.gl/next/docs/modules/core/loader-utils.md)         | Loader contracts, streams, file systems, and source utilities.                                       |
| [`@loaders.gl/core/worker-utils`](https://loaders.gl/next/docs/modules/core/worker-utils.md)         | Worker pools, messaging, and transfer helpers.                                                       |
| [`@loaders.gl/core/schema`](https://loaders.gl/next/docs/modules/core/schema.md)                     | Shared schemas, table and geometry types.                                                            |
| [`@loaders.gl/core/schema-utils`](https://loaders.gl/next/docs/modules/core/schema-utils.md)         | Schema conversion, table helpers, and Arrow transport.                                               |
| [`@loaders.gl/core/polyfills`](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md) | Independent Node platform adapters.                                                                  |
| `@loaders.gl/core/scan`                                                                                   | Scan planning and execution, Arrow queries, portable predicates, and format-neutral source wrappers. |
| `@loaders.gl/core/arrow-geometry`                                                                         | Geometry builders and loader-facing conversion helpers.                                              |
| `@loaders.gl/core/geoarrow`                                                                               | GeoArrow inspection, validation, conversion, coordinate operations, clustering, and spatial indexes. |
| `@loaders.gl/core/wkt`                                                                                    | Geometry codec helpers; TWKB is also available from `@loaders.gl/core/wkt/twkb`.                     |

Import these APIs through their subpaths. The core root entrypoint keeps its existing exports. Format loader and writer descriptors remain in their format modules, including `@loaders.gl/geospatial/wkt`; database adapters remain in `@loaders.gl/sql`.

```
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/core/scan';

import {GeoArrowBuilder} from '@loaders.gl/core/arrow-geometry';

import {inspectGeoArrowVector} from '@loaders.gl/core/geoarrow';

import {convertWKTToGeometry} from '@loaders.gl/core/wkt';
```

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
