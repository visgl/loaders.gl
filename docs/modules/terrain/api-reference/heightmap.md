---
title: Heightmap utilities
description: Decode Terrarium or custom RGB elevation into an unpadded height grid.
---

# Heightmap utilities

Use `@loaders.gl/terrain/heightmap` when you need elevation samples without mesh
reconstruction, Arrow conversion, image loading, or worker setup. This entry point
has no runtime dependencies.

```typescript
import {getImageData} from '@loaders.gl/images';
import {
  decodeTerrainHeightmap,
  TERRARIUM_ELEVATION_DECODER
} from '@loaders.gl/terrain/heightmap';

// image is an already decoded image, for example from ImageBitmapLoader.
const heightmap = decodeTerrainHeightmap(getImageData(image), TERRARIUM_ELEVATION_DECODER);
const heightInMeters = heightmap.heights[row * heightmap.width + column];
```

## decodeTerrainHeightmap(image, elevationDecoder)

- `image`: `{data, width, height}` with `Uint8Array` or `Uint8ClampedArray` interleaved
  RGBA bytes. Width and height must be positive safe integers, and the byte count
  must be exactly `width * height * 4`. Alpha is ignored, including transparent pixels.
- `elevationDecoder`: finite numeric `rScaler`, `gScaler`, `bScaler`, and `offset`
  coefficients. The formula is `R * rScaler + G * gScaler + B * bScaler + offset`,
  with unnormalized color bytes in `[0, 255]`.
- Returns `{width, height, heights}` with a fresh, unpadded row-major `Float32Array`.
  The input is not modified. Invalid dimensions, byte counts, or coefficients throw
  `RangeError`; normal typed-array allocation limits still apply.

The decoder preserves input row order. It does not flip rows, interpolate, stitch
tile edges, identify missing samples, generate normals, or transform coordinates.
Output units and the vertical reference are determined by the encoding and provider.

## TERRARIUM_ELEVATION_DECODER

A frozen preset for [Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md):

```typescript
{rScaler: 256, gScaler: 1, bScaler: 1 / 256, offset: -32768}
```

The result is elevation in meters. Decode the image losslessly into its original
RGB bytes; display-oriented color transformations or lossy recompression can corrupt
heights. Do not interpolate encoded RGB channels across a channel carry; decode first,
then interpolate heights.

[Mapterhorn](https://mapterhorn.com/data-access/) serves this encoding in 512-pixel
WebP tiles. It is a data provider, not a separate elevation format. Fetching its
tiles or archives and showing the [required attribution](https://mapterhorn.com/attribution/)
remain application responsibilities.

For a reconstructed mesh instead, pass this preset as
`terrain.elevationDecoder` to [TerrainLoader](./terrain-loader.md). Its existing
tessellation, border handling, and output shapes are unchanged.

## Shared physical grids

`createTerrainHeightGrid(heightmap, metadata, validity?)` detaches decoded samples,
the footprint and an optional byte validity mask into a `TerrainHeightGrid`. Grids
require at least two rows and columns. Metadata is explicit:

```typescript
import {createTerrainHeightGrid, sampleTerrainHeightGrid} from '@loaders.gl/terrain/heightmap';

const grid = createTerrainHeightGrid(heightmap, {
  bounds: [west, south, east, north], // unwrapped EPSG:3857 meters
  registration: 'pixel-center',     // or 'grid-node', including both edges
  verticalDatum: 'unknown'          // or 'ellipsoidal' / 'orthometric'
}, validity);
const elevation = sampleTerrainHeightGrid(grid, [mercatorX, mercatorY]);
```

Rows run north to south, columns west to east. Heights are physical meters, never
display exaggeration. The constructor copies arrays, normalizes valid bytes to 0/1,
replaces explicitly invalid heights with NaN, and rejects nonfinite valid samples.
Without a mask every sample must be finite. Alpha, datum conversion and horizontal
wrapping remain source/host responsibilities. Treat published grids as immutable.

`sampleTerrainHeightGrid` performs bilinear interpolation on a valid grid. Closed
footprint edges clamp to the nearest pixel center. Outside or nonfinite coordinates
and missing samples with nonzero interpolation weight return `null`; a valid zero
height remains zero. The sampler does not repair holes or blend neighboring tiles.

## Neighborhoods and shared edge nodes

`sampleTerrainNeighborhood(grids, position)` samples touching footprints in source
order and averages their contributions at shared edges and corners. A hole in any
contributing grid remains a hole. Grids must use the same vertical datum; resolution
and registration may differ. No longitude wrapping or datum conversion is implicit.
Use a retained `TerrainHeightField` for repeated queries instead of rebuilding it.

`resampleTerrainNodes(grid, neighbors = [])` creates detached north-first,
`grid-node` samples over the source footprint. A pixel-centered W×H grid becomes
(W+1)×(H+1); a grid-node source keeps its dimensions. Neighbors must match source
dimensions, registration, footprint extent (within relative 1e-8) and vertical datum.
Repeated neighbor references count once. Adjacent nodes blend touching footprints;
absent neighbors clamp to the source edge. Missing samples are not filled.

## TerrainHeightField

```typescript
import {TerrainHeightField} from '@loaders.gl/terrain/heightmap';

const field = new TerrainHeightField(grids, {maxMaskBytes: 8 * 1024 * 1024});
const elevation = field.sampleHeight([mercatorX, mercatorY]);
const loaded = field.coversBounds([west, south, east, north]);
const statistics = field.getStatistics();
```

Construction snapshots membership, descriptors and footprints, but **borrows immutable
sample and validity arrays**. Supply valid physical grids, normally created with
`createTerrainHeightGrid`, and rebuild the field when their data changes. Mixed datums
are rejected. Empty fields return null samples and false coverage.

- `sampleHeight(position)`: ordered bilinear neighborhood sampling. Closed touching
  edges use a footprint-relative 1e-10 tolerance for coordinate roundoff; points
  admitted by this tolerance clamp to the contributing footprint.
- `coversBounds(bounds)`: conservative complete rectangular coverage with valid
  bilinear support, including zero-width/height probes. Overlaps cannot conceal gaps;
  coverage uses exact interval/slab unions, not area tolerances. This is a physical
  height-grid admission test, **not** a displayed triangle or terrain-hole pick.
- `getStatistics()`: detached counts for grids, spatial bounds tests, candidate
  grids, retained mask bytes/builds and validity samples inspected.

Large fields prune queries through a static footprint tree while preserving source
accumulation order. Summed-area validity masks are built lazily within
`maxMaskBytes` (default 8 MiB). Zero or insufficient budget uses exact scans with
the same answers. This limit covers retained mask arrays only, not source arrays,
tree metadata or transient query allocations. No provider, cache eviction, worker,
renderer, projection engine or GPU resource is owned.

These utilities adapt Tangram's validated physical terrain field implementation;
rendered mesh topology, geometry indexes and renderer lifecycle stay downstream.

## Shared surface query boundary

`TerrainSurface`, `TerrainRay`, `TerrainSurfaceHit` and `TerrainSurfaceBounds` are
structural types exported by the heightmap entry and, type-only, the package root.
They describe a host-owned displayed triangle surface, not a loader implementation.

- `projection` is `web-mercator` (XYZ meters) or `globe` (host-defined common units).
- `intersectRay(ray, maxDistance?)` returns the nearest loaded hit within an inclusive
  distance measured in surface units, regardless of direction vector length.
- A hit's `position` and `normal` describe displayed geometry. Its `coordinate` is
  longitude/latitude degrees and **unexaggerated physical elevation meters**.
- `triangleIndex` and `barycentric` retain original triangle identity and vertex order.
- Optional `getBounds()` conservatively encloses queryable triangles; `null` means
  an empty surface. A query miss does not certify loaded coverage or world visibility.

Screen-to-ray conversion, globe radius, view/stereo routing, spatial-index ownership,
terrain transitions and resource disposal belong to adapters. These types introduce
no deck.gl, Tangram, GPU or math.gl runtime dependency. Implementations must query
the same geometry generation they display; physical and exaggerated heights must
not be interchanged.
