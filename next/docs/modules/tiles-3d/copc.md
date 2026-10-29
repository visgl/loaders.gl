Point-cloud module

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)

# @loaders.gl/tiles-3d/copc

Read only the points the view needs. COPC packages a LAS point cloud as a range-readable LAZ file with an octree hierarchy for selective cloud access.

[COPC format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the current COPC/LAS projection-record support and vertical/compound CRS roadmap.

![From-v4.1](https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square)![source loader from v5.0](https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square)[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

The cloud point path

## Let the hierarchy choose the ranges.

COPC puts an octree directory beside the point data. A viewport or bounded query can use that directory first, then fetch only the compressed nodes that can contribute results.

one .copc.laz objectCOPC 1.0

**LAS header**scale · bounds · CRS

**COPC info VLR**root cube · spacing

**hierarchy pages**node → byte range

**LAZ point chunks**selected nodes only

→HTTP ranges

bounded request

⌖bounds + level of detail

\#columns + limit

↯cancel when enough arrives

→decode selected nodes

[application result](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

[**Arrow point batches**positions · color · attributes ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The same source can serve progressive viewport tiles or a bounded scan without changing the underlying point representation.

![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)[Try It](https://loaders.gl/next/examples/pointclouds/copc-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)[COPCSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)[COPCWriter](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)

The COPC path

## Metadata first. Bytes second.

The hierarchy narrows the request before point records are fetched. Applications can use a tileset source for view-driven loading or the scan contract for bounded, column-selective queries.

01

Discover

Header, VLRs, bounds, CRS, and hierarchy metadata

02

Select

Spatial nodes, levels of detail, and requested attributes

03

Fetch

Only the LAZ byte ranges needed for those nodes

04

Return

Point objects or ordered Arrow point batches

The `@loaders.gl/tiles-3d/copc` module loads and writes the [COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md) format. Its primary reader is TypeScript-only and performs native COPC hierarchy, byte-range, and LAZ point decoding.

Detailed guide

## COPC module details

The sections below cover installation, source and writer APIs, compatibility, and the exact point and range behavior.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tiles-3d
```

## APIs[​](#apis "Direct link to APIs")

| API                                                                                                                                                                                               | Description                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`COPCSourceLoader`](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md) ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square) | Loads viewport-selected point data from COPC files through byte ranges. |
| [`COPCWriter`](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)                                                                                              | Writes Mesh or Mesh Arrow table point clouds as COPC 1.0 data.          |

## Attribution[​](#attribution "Direct link to Attribution")

The original module was based on Connor Manning's [copc.js](https://github.com/connormanning/copc.js/) project under the MIT license. The current primary reader is a first-party TypeScript implementation with no `copc` runtime dependency.
