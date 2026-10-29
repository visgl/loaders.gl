Cloud-native vector module

![](/next/images/format-logos/flatgeobuf-logo.png)

# Ask a vector file for the features in a box.

FlatGeobuf combines a binary feature layout with a spatial index that can be read over HTTP ranges. The module turns that into a loader and source for bounded vector access and Arrow feature tables.

[FlatGeobuf format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

Cloud-native reads

## Ask for the data. Fetch only the bytes behind it.

Range-aware sources translate a logical request into scheduled byte ranges. Metadata, caching, and cancellation stay in the transport layer while the application works with a normal decoded result.

Logical request

[**A tile**visible scene content↗](https://loaders.gl/next/docs/modules/tiles.md)[**A column**selected table data↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**A window**selected raster pixels↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[**A point region**bounded cloud data↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

locat&#x65;**→**

\[ ]

Range scheduler

mergecacheabort

offsets · limits · HTTP Range

rea&#x64;**→**

Useful bytes

**Header bytes**discover the layout

**Selected intervals**fetch only what is needed

**Decoded result**table, tile, or raster data

The same access pattern powers tiled scenes, columnar files, point clouds, and windowed rasters without making the whole object a prerequisite.

The FlatGeobuf path

## Use the index before decoding features.

A source can discover the header and packed R-tree, select candidate features by bounds, then decode only the ranges needed for the request.

01

Index

Packed R-tree for spatial candidate selection

02

Access

HTTP range reads for cloud-hosted files

03

Output

GeoJSON-like features or Arrow feature tables

04

Operations

Bounds, predicates, projection, limits, and cancellation

![From-v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)![arrow output from v5.0](https://img.shields.io/badge/arrow_output-From_v5.0-blue.svg?style=flat-square)![source loader from v5.0](https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square)

The `@loaders.gl/geospatial/flatgeobuf` module handles the [FlatGeobuf](http://flatgeobuf.org/) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

Detailed guide

## FlatGeobuf module details

The sections below cover installation, loader and source APIs, spatial filtering, Arrow output, and attribution.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Source                                                                                                                                                                                                       | Description                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`FlatGeobufLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)                                                                                              | Loads FlatGeobuf files as geospatial tables.                          |
| [`FlatGeobufSourceLoader`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md) ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square) | Streams features and spatially filtered data from FlatGeobuf sources. |

## Attribution[​](#attribution "Direct link to Attribution")

The `FlatGeobufLoader` forks the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module under the BSD 2-Clause license.
