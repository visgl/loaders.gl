---
title: Heightmap utilities
description: Decode Terrarium or custom RGB elevation into an unpadded height grid.
---

# Heightmap utilities

Use `@loaders.gl/raster/terrain/heightmap` when you need elevation samples without mesh
reconstruction, Arrow conversion, image loading, or worker setup. This entry point
has no runtime dependencies.

```typescript
import {getImageData} from '@loaders.gl/images';
import {
  decodeTerrainHeightmap,
  TERRARIUM_ELEVATION_DECODER
} from '@loaders.gl/raster/terrain/heightmap';

// image is an already decoded image, for example from ImageLoader.
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

## Terrain sampling

Use `HeightField` or `TiledHeightField` from `@math.gl/geospatial/terrain` to sample decoded heights. Provide an explicit coordinate frame, registration, validity and height reference. See the [upgrade guide](../../../../upgrade-guide.md) for migration details.

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
