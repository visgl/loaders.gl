Data conversion

# Move between data shapes

Compose small, explicit converters when the next stage needs a different table, geometry, or rendering representation.

[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

Explicit conversion paths

## Connect formats through data shapes.

Read a format, work with a documented table or geometry shape, then write the result where it needs to go. Each edge is an explicit converter that can be composed with the next one.

Read

[CSV / JSONLrecords and streams↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[GeoJSONfeatures and geometry↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[Parquetcolumns and row groups↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[glTF / GLBscenes and meshes↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

→

convert()

Application shape

tablegeometrymesh

normalize · transform · preserve

→

Write

[Arrow IPCtyped batches↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[GeoParquetcolumnar geospatial data↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[LAS / LAZpoint cloud data↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[glTF / GLBportable scene assets↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)

Keep conversion logic at the boundary so the rest of the application can stay format-agnostic.

The conversion path

## Make the next shape an explicit decision.

Converters connect related data representations without making every loader understand every other format. Applications choose the edges they need and keep the rest out of the bundle.

01

Detect

Identify the source and target data shapes

02

Compose

Pass the leaf converters that define an allowed path

03

Preserve

Keep metadata and binary columns where the target supports them

04

Render

Use dedicated geometry converters when GeoJSON is not required

The loaders.gl converter system is a graph of small, explicit converter objects. You pass the converters you want, `convert()` finds a path, and each leaf module handles one direct step.

```
import {convert, TableConverter} from '@loaders.gl/core/schema-utils';

import {ArrowConverter} from '@loaders.gl/tables/arrow';

import {

  FeatureCollectionConverter,

  GeometryConverter

} from '@loaders.gl/core/geoarrow';



const arrowTable = convert(table, 'arrow', [TableConverter, ArrowConverter]);

const wkb = convert(geometry, 'wkb', [GeometryConverter]);

const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);
```

![Converter flow](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MjAiIHZpZXdCb3g9IjAgMCAxMjAwIDQyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0icGFnZSIgeDE9IjgwIiB5MT0iNDgiIHgyPSIxMTIwIiB5Mj0iMzcyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGNkZCRkYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjdGOEZDIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJkYXRhQSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMENBN0U2Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzI3QzNBNyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZGF0YUIiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0ZGOEEzRCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRkIzNDciLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImNvbnZlcnQiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzE0MzI0QiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyODU5NkIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii0yMCUiIHk9Ii0yMCUiIHdpZHRoPSIxNDAlIiBoZWlnaHQ9IjE2MCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMTIiIHN0ZERldmlhdGlvbj0iMTYiIGZsb29kLWNvbG9yPSIjMEUyMjM0IiBmbG9vZC1vcGFjaXR5PSIwLjEyIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxtYXJrZXIgaWQ9ImFycm93IiBtYXJrZXJXaWR0aD0iMTYiIG1hcmtlckhlaWdodD0iMTYiIHJlZlg9IjE0IiByZWZZPSI4IiBvcmllbnQ9ImF1dG8iPgogICAgICA8cGF0aCBkPSJNMSAxTDE0IDhMMSAxNSIgc3Ryb2tlPSIjNEU3MTg1IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogICAgPC9tYXJrZXI+CiAgPC9kZWZzPgoKICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MjAiIHJ4PSIyNCIgZmlsbD0idXJsKCNwYWdlKSIvPgoKICA8ZyBmaWx0ZXI9InVybCgjc2hhZG93KSI+CiAgICA8cmVjdCB4PSI3OCIgeT0iNzAiIHdpZHRoPSIyNzYiIGhlaWdodD0iMjgwIiByeD0iMjAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNDRkUwRUMiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHJlY3QgeD0iNDYyIiB5PSI1MiIgd2lkdGg9IjI3NiIgaGVpZ2h0PSIzMTYiIHJ4PSIyMCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0NGRTBFQyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8cmVjdCB4PSI4NDYiIHk9IjcwIiB3aWR0aD0iMjc2IiBoZWlnaHQ9IjI4MCIgcng9IjIwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjQ0ZFMEVDIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8L2c+CgogIDx0ZXh0IHg9IjExMiIgeT0iMTEwIiBmaWxsPSIjMTY4MEFCIiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iNzAwIj5JbnB1dCBkYXRhPC90ZXh0PgogIDx0ZXh0IHg9IjQ5NiIgeT0iOTIiIGZpbGw9IiMyMjU0NjciIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI3MDAiPkNvbnZlcnRlcnM8L3RleHQ+CiAgPHRleHQgeD0iODgwIiB5PSIxMTAiIGZpbGw9IiMxNjgwQUIiIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI3MDAiPk91dHB1dCBkYXRhPC90ZXh0PgoKICA8Zz4KICAgIDxyZWN0IHg9IjExMiIgeT0iMTQwIiB3aWR0aD0iMjA4IiBoZWlnaHQ9IjU0IiByeD0iMTIiIGZpbGw9InVybCgjZGF0YUEpIi8+CiAgICA8dGV4dCB4PSIxMzYiIHk9IjE3MyIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI3MDAiPkdlb0pTT048L3RleHQ+CgogICAgPHJlY3QgeD0iMTEyIiB5PSIyMTQiIHdpZHRoPSIyMDgiIGhlaWdodD0iNTQiIHJ4PSIxMiIgZmlsbD0idXJsKCNkYXRhQikiLz4KICAgIDx0ZXh0IHg9IjEzNiIgeT0iMjQ3IiBmaWxsPSIjNDAyMjAwIiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIj5BcnJvdyB0YWJsZTwvdGV4dD4KCiAgICA8cmVjdCB4PSIxMTIiIHk9IjI4OCIgd2lkdGg9IjIwOCIgaGVpZ2h0PSIzNCIgcng9IjEwIiBmaWxsPSIjRUZGNUY4IiBzdHJva2U9IiNEOEUzRUEiLz4KICAgIDx0ZXh0IHg9IjEzNiIgeT0iMzEwIiBmaWxsPSIjNEM2Njc2IiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iNjAwIj5zaGFwZSBkZXRlY3RlZCBmcm9tIGlucHV0PC90ZXh0PgogIDwvZz4KCiAgPGc+CiAgICA8cmVjdCB4PSI0OTYiIHk9IjEyMiIgd2lkdGg9IjIwOCIgaGVpZ2h0PSI1MiIgcng9IjEyIiBmaWxsPSJ1cmwoI2NvbnZlcnQpIi8+CiAgICA8dGV4dCB4PSI1MjAiIHk9IjE1NCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI3MDAiPlRhYmxlQ29udmVydGVyPC90ZXh0PgoKICAgIDxyZWN0IHg9IjQ5NiIgeT0iMTkyIiB3aWR0aD0iMjA4IiBoZWlnaHQ9IjUyIiByeD0iMTIiIGZpbGw9InVybCgjY29udmVydCkiLz4KICAgIDx0ZXh0IHg9IjUyMCIgeT0iMjI0IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkludGVyLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjcwMCI+QXJyb3dDb252ZXJ0ZXI8L3RleHQ+CgogICAgPHJlY3QgeD0iNDk2IiB5PSIyNjIiIHdpZHRoPSIyMDgiIGhlaWdodD0iNTIiIHJ4PSIxMiIgZmlsbD0idXJsKCNjb252ZXJ0KSIvPgogICAgPHRleHQgeD0iNTIwIiB5PSIyOTQiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iNzAwIj5HZW9tZXRyeUNvbnZlcnRlcjwvdGV4dD4KCiAgICA8cmVjdCB4PSI0OTYiIHk9IjMzMiIgd2lkdGg9IjIwOCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjRENFN0VFIi8+CiAgICA8dGV4dCB4PSI1MTQiIHk9IjM0NyIgZmlsbD0iIzRDNjY3NiIgZm9udC1mYW1pbHk9IkludGVyLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9IjYwMCI+ZGlzcGF0Y2hlciBwaWNrcyB0aGUgc2hvcnRlc3QgcGF0aDwvdGV4dD4KICA8L2c+CgogIDxnPgogICAgPHJlY3QgeD0iODgwIiB5PSIxNDAiIHdpZHRoPSIyMDgiIGhlaWdodD0iNTQiIHJ4PSIxMiIgZmlsbD0idXJsKCNkYXRhQSkiLz4KICAgIDx0ZXh0IHg9IjkwNCIgeT0iMTczIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkludGVyLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9IjcwMCI+R2VvQXJyb3c8L3RleHQ+CgogICAgPHJlY3QgeD0iODgwIiB5PSIyMTQiIHdpZHRoPSIyMDgiIGhlaWdodD0iNTQiIHJ4PSIxMiIgZmlsbD0idXJsKCNkYXRhQikiLz4KICAgIDx0ZXh0IHg9IjkwNCIgeT0iMjQ3IiBmaWxsPSIjNDAyMjAwIiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iNzAwIj5XS0I8L3RleHQ+CgogICAgPHJlY3QgeD0iODgwIiB5PSIyODgiIHdpZHRoPSIyMDgiIGhlaWdodD0iMzQiIHJ4PSIxMCIgZmlsbD0iI0VGRjVGOCIgc3Ryb2tlPSIjRDhFM0VBIi8+CiAgICA8dGV4dCB4PSI5MDQiIHk9IjMxMCIgZmlsbD0iIzRDNjY3NiIgZm9udC1mYW1pbHk9IkludGVyLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9IjYwMCI+c2FtZSBBUEksIGRpZmZlcmVudCBzaGFwZTwvdGV4dD4KICA8L2c+CgogIDxwYXRoIGQ9Ik0zNTQgMjEwSDQ0OCIgc3Ryb2tlPSIjNEU3MTg1IiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgbWFya2VyLWVuZD0idXJsKCNhcnJvdykiLz4KICA8cGF0aCBkPSJNNzM4IDIxMEg4MzIiIHN0cm9rZT0iIzRFNzE4NSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIG1hcmtlci1lbmQ9InVybCgjYXJyb3cpIi8+CgogIDxyZWN0IHg9IjQwNSIgeT0iMTgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIHJ4PSIyMCIgZmlsbD0iI0U4RjFGNiIvPgogIDx0ZXh0IHg9IjQxOCIgeT0iMjE3IiBmaWxsPSIjNEU3MTg1IiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iNzAwIj4xPC90ZXh0PgoKICA8cmVjdCB4PSI3OTAiIHk9IjE4MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjYwIiByeD0iMjAiIGZpbGw9IiNFOEYxRjYiLz4KICA8dGV4dCB4PSI4MDMiIHk9IjIxNyIgZmlsbD0iIzRFNzE4NSIgZm9udC1mYW1pbHk9IkludGVyLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjcwMCI+MjwvdGV4dD4KPC9zdmc+Cg==)

Detailed guide

## Converter families and shape paths

The sections below document the dispatcher, table and Arrow conversions, GeoArrow and feature collections, render-focused utilities, and format categories.

## In This Section[​](#in-this-section "Direct link to In This Section")

| Topic                                                                                                                          | Use it for                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| [Converter dispatcher](https://loaders.gl/next/docs/developer-guide/converters/dispatcher.md)                             | How `convert()` detects shapes and chooses a path                                    |
| [Table and Arrow converters](https://loaders.gl/next/docs/developer-guide/converters/table-and-arrow-converters.md)       | Moving between loaders.gl table wrappers and Apache Arrow                            |
| [GeoArrow converters](https://loaders.gl/next/docs/developer-guide/converters/geoarrow-converters.md)                     | Converting GeoArrow tables and rewriting GeoArrow geometry encodings                 |
| [Feature collection converters](https://loaders.gl/next/docs/developer-guide/converters/feature-collection-converters.md) | GeoJSON, Flat GeoJSON, binary feature collections, and geometry wire formats         |
| [Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)                         | Direct geometry-column to `BinaryFeatureCollection` and Arrow-backed binary wrappers |
| [Format categories](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)                         | The shapes and format families these converters connect                              |

## Core Ideas[​](#core-ideas "Direct link to Core Ideas")

* Converters are opt-in. There is no global registry.
* Each leaf converter handles direct edges only.
* `convert()` can compose multiple direct steps when you pass enough converters.
* Geometry rendering does not have to route through GeoJSON.

## Current Converter Families[​](#current-converter-families "Direct link to Current Converter Families")

| Converter                    | Package                         | Direct responsibility                                        |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `TableConverter`             | `@loaders.gl/core/schema-utils` | loaders.gl table wrappers                                    |
| `ArrowConverter`             | `@loaders.gl/tables/arrow`      | Apache Arrow tables and table wrappers                       |
| `GeoArrowTableConverter`     | `@loaders.gl/core/geoarrow`     | GeoArrow tables and wrapper/table shapes                     |
| `GeoArrowGeometryConverter`  | `@loaders.gl/core/geoarrow`     | GeoArrow geometry encoding rewrites                          |
| `FeatureCollectionConverter` | `@loaders.gl/core/geoarrow`     | GeoJSON, Flat GeoJSON, binary feature collections            |
| `GeometryConverter`          | `@loaders.gl/core/geoarrow`     | single geometry values like WKB, WKT, TWKB, GeoJSON geometry |

## Render-Focused Conversions[​](#render-focused-conversions "Direct link to Render-Focused Conversions")

Some conversions are not expressed as generic converter objects because they are rendering utilities rather than shape-dispatch nodes.

These include:

* `convertGeometryColumnToBinaryFeatureCollection()`
* `convertGeometryValuesToBinaryFeatureCollection()`
* `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection()`
* `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection()`

These utilities are documented in [Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md).

## Why This Matters[​](#why-this-matters "Direct link to Why This Matters")

The converter system gives you a few practical wins:

* small bundles through explicit imports
* predictable conversion paths
* reusable format-specific code in leaf modules
* a clean separation between table conversion, geometry conversion, and render conversion

The rest of this section goes converter by converter and shape by shape.
