Point-cloud module

# Traverse Potree clouds without loading the whole octree.

Potree datasets expose a hierarchy and node payloads that can be requested progressively. loaders.gl turns supported Potree layouts into a source and scan shape that applications can use alongside COPC.

[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[Potree source](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the point-cloud CRS support matrix and reprojection roadmap.

![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)![source loader from v5.0](https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square)[![Scan supported for compatible Potree versions](https://img.shields.io/badge/Scan-Supported_versions-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

[Try It](https://loaders.gl/next/examples/pointclouds/potree-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md)[PotreeLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)[PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

The Potree path

## Use the hierarchy as the query plan.

Metadata identifies the coordinate system, point attributes, and node layout. Traversal then selects the nodes that match the view or scan request and fetches only their payloads.

01

Supported layouts

Potree 1.0–1.8 and current 2.0 dataset layouts

02

Traversal

Bounds, levels, spacing, and cancellation

03

Payloads

Potree binary nodes plus LAS and LAZ records

04

Output

Point tiles and ordered Arrow point batches

Support for loading and traversing [potree](http://potree.org/) format point clouds.

Detailed guide

## Potree compatibility details

The sections below document supported metadata and node layouts, scan behavior, and source-specific limitations.

## Format Support[​](#format-support "Direct link to Format Support")

Potree reads dataset versions **1.0–1.8 and 2.0**. Writers produce legacy binary node files and modern DEFAULT output. See the [Potree format reference](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md) for the version matrix, read/write feature table, and qualification limits.

Use [PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md) for both layouts: pass `cloud.js` for 1.x or `metadata.json` for 2.0. Directory inputs retain the legacy `cloud.js` default. Converter/viewer release numbers are distinct from dataset versions. See [Potree writers](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-writer.md) for complete typed file collections.

## Scan support[​](#scan-support "Direct link to Scan support")

For supported **1.x** Potree versions and layouts, `PotreeNodeSource` exposes the same point-cloud query shape as COPC. Unsupported versions publish metadata with a reason and do not claim an executor.

| Capability                                    | Support                            | Execution                                            |
| --------------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| Entry point                                   | ⚠️ `scan()` for compatible sources | Ordered Arrow point batches                          |
| Schema, bounds, CRS, and hierarchy            | ✅ Supported                       | Potree metadata and hierarchy files                  |
| Bounds, minimum/maximum level, target spacing | ✅ Supported                       | Hierarchy pushdown followed by exact point filtering |
| Attribute predicate                           | ✅ Supported                       | Residual after node decoding                         |
| Projection and global limit                   | ✅ Supported                       | Applied in caller column order across all nodes      |
| Cancellation and early return                 | ✅ Supported                       | Stops hierarchy, payload, and result work            |
| Unsupported layouts                           | ⚠️ Metadata only                   | Execution metadata contains the concrete reason      |

Potree currently decodes complete point records before projection. The capability metadata reports that distinction so applications do not confuse correct results with selective decoder pushdown.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/tiles-3d
```

## Usage[​](#usage "Direct link to Usage")

For a complete point-cloud source, create a `DataSource` and pass it to the point-cloud tileset runtime. The source resolves the Potree hierarchy and node payloads as the viewport requests them:

Potree can also be used through the `DataSource` path with the lightweight point-cloud manager:

```
import {createDataSource} from '@loaders.gl/core';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';

import {PotreeSourceLoader} from '@loaders.gl/tiles-3d/potree';



const dataSource = createDataSource(POTREE_URL, [PotreeSourceLoader], {

  core: {type: 'potree'},

  potree: {}

});



const tileset = new PointCloudTileset(dataSource);

await tileset.selectTiles(viewport);
```

## API[​](#api "Direct link to API")

This modules provides the following exports:

* `PotreeHierarchyChunkLoader` for the hierarchy indices
* `PotreeSourceLoader` for point-cloud tile sources ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

## Modern sources and authoring[​](#modern-sources-and-authoring "Direct link to Modern sources and authoring")

* `PotreeLoader`: one metadata-only declaration loader for both wire layouts, with the `@loaders.gl/tiles-3d/potree/potree-loader` parser subpath.
* `PotreeSourceLoader`: version-specific readers behind one source factory, compatible with `PointCloudTileset` and v5 tile-converter traversal. Modern 2.0 datasets use native-coordinate range reads; query `scan()` remains available only for compatible legacy datasets.
* `PotreeWriter`: standard metadata writer.
* `encodePotreeDataset`: complete legacy or modern file collections from decoded Mesh/Arrow rows.

Follow-ups include 2.0 query scans, BROTLI output, out-of-core authoring and application download examples. Native modern coordinates retain their CRS declaration without automatic projection.

## Attribution[​](#attribution "Direct link to Attribution")

The `PotreeLoader` is a fork of Markus Schuetz' potree code (<https://github.com/potree/potree>) under BSD-2 clause license.
