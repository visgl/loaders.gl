Potree source

# Traverse an octree as the view moves.

PotreeSourceLoader turns supported Potree metadata and node payloads into a source that can be traversed progressively. It shares the point-cloud runtime model with COPC while respecting Potree's own layouts.

[Potree module](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[COPC source](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-source-loader.md)

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

[Try It](https://loaders.gl/next/examples/pointclouds/potree-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md)[PotreeLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)[PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

What this loader does

## Read the hierarchy before the points.

Potree metadata identifies the node structure and attributes. The source uses that information to select relevant nodes and request their payloads progressively.

01

Discover

Cloud metadata, bounds, attributes, and hierarchy

02

Select

Nodes by bounds, level, spacing, and cancellation

03

Decode

Potree binary, LAS, and LAZ node payloads

04

Return

Normalized point tiles and Arrow point batches

`PotreeSourceLoader` creates a point-cloud tile source for Potree datasets rooted at `cloud.js` (1.x), `metadata.json` (2.0), or a legacy dataset directory.

Detailed guide

## Source construction and traversal

The sections below document source creation, returned tile methods, supported payloads, and compatibility notes.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {PotreeSourceLoader} from '@loaders.gl/tiles-3d/potree';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';



const dataSource = createDataSource(url, [PotreeSourceLoader], {

  potree: {}

});



const tileset = new PointCloudTileset(dataSource);

await tileset.selectTiles(viewport);
```

## Data Source[​](#data-source "Direct link to Data Source")

The created data source exposes the point-cloud tile methods used by `PointCloudTileset`:

* `getMetadata()` returns Potree metadata and an inferred initial view state.
* `getRootTile()` returns the root octree tile header.
* `getChildren(tile)` returns available child tile headers.
* `loadTileContent(tile)` returns normalized point positions, optional colors and normals, point count, and cartographic origin.

## Notes[​](#notes "Direct link to Notes")

* See the [Potree module overview](https://loaders.gl/next/docs/modules/tiles-3d/potree.md) for the Potree format version support matrix.
* `LAS` and `LAZ` node payloads are loaded through `LASLoader`.
* Binary Potree point attribute payloads are loaded through `PotreeBinLoader`.

## Potree 2.0 range traversal[​](#potree-20-range-traversal "Direct link to Potree 2.0 range traversal")

Progressively reads Potree 2.0 datasets (`metadata.json`, `hierarchy.bin`, `octree.bin`). PotreeConverter 2.x, including 2.1.5, writes the **2.0 dataset format**; converter release numbers and viewer release numbers are distinct from dataset versions.

```
import {PotreeSourceLoader} from '@loaders.gl/tiles-3d/potree';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';



const source = PotreeSourceLoader.createDataSource('https://example.com/cloud/metadata.json', {});

await source.initialize();

const tileset = new PointCloudTileset(source);

// Select tiles using the application's viewport and placement.

// When done:

source.close();
```

`PotreeLoader` parses metadata for either dataset version. Direct parser access is available through `@loaders.gl/tiles-3d/potree/potree-loader`; source decoding uses internal version-specific readers.

### Traversal and content[​](#traversal-and-content "Direct link to Traversal and content")

* `initialize()` waits for metadata and the first hierarchy page.
* `getMetadata().formatSpecificMetadata` returns an independent declaration, including the supplied projection; modern native-coordinate sources do not infer a geographic view state.
* `getRootTile()` and `getChildren(tile)` resolve required hierarchy proxies and share concurrent reads of the same proxy. Immediate child proxies are resolved before returning their headers.
* `loadTileContent(tile)` reads only that node's byte range and returns Arrow point data. Caller header counts and ranges are ignored; the source owns the validated hierarchy.
* `close()` cancels pending I/O and releases hierarchy state. Repeated calls are safe.

DEFAULT records and BROTLI attribute-major Morton records are supported. Native XYZ is returned as Float64 positions using the declared axis scale and offset. RGB remains normalized uint16; custom attributes preserve all ten scalar types, including exact signed and unsigned 64-bit IDs. Positions and colors also have `POSITION` and `COLOR_0` aliases. No reprojection or CRS inference is performed. Applications supply placement for native cartesian coordinates.

This source satisfies the point-cloud traversal contract used by the v5 tile-converter. It does not yet provide the legacy source's `scan()` query API. `getQueryMetadata()` reports this metadata-only status, and `scan()` rejects for modern datasets.

### HTTP and limits[​](#http-and-limits "Direct link to HTTP and limits")

Servers must honor Range requests with status 206 and the exact requested Content-Range. Relative resource URLs use the final metadata response URL and retain its query credentials. Inject a transport with `core.fetch`; all I/O uses the portable DataSource fetch API.

Options in `potree` for modern datasets:

| Option              | Default | Scope                                                               |
| ------------------- | ------- | ------------------------------------------------------------------- |
| `maxMetadataBytes`  | 1 MiB   | Metadata response                                                   |
| `maxHierarchyBytes` | 16 MiB  | Aggregate hierarchy page responses                                  |
| `maxPointBytes`     | 64 MiB  | Compressed range and declared decoded wire/attribute bytes per node |
| `maxNodes`          | 100000  | Discovered hierarchy nodes                                          |
| `signal`            | —       | Source lifetime cancellation                                        |

These limits cover resources and declared output allocations, not total JavaScript heap. Brotli fallback decompression can allocate temporary output before its decoded length is checked; Arrow conversion, cached application content and temporary response chunks require additional memory. Metadata is validated before point allocation; hierarchy offsets retain exact uint64 values until they are checked against the supported fetch range.

### Format references[​](#format-references "Direct link to Format references")

* [PotreeConverter 2.1.5](https://github.com/potree/PotreeConverter/releases/tag/2.1.5)
* [Potree 2.0 loader](https://github.com/potree/potree/blob/develop/src/modules/loader/2.0/OctreeLoader.js)
* [Brotli decoder layout](https://github.com/potree/potree/blob/develop/src/modules/loader/2.0/DecoderWorker_brotli.js)

Use [Potree writers](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-writer.md) to generate complete file collections.
