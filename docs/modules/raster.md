# @loaders.gl/raster

GeoTIFF, numeric TIFF, OME-TIFF, LERC, image-encoded terrain, and quantized mesh.

```
npm install @loaders.gl/core @loaders.gl/raster
```

The format subpaths export metadata loaders. Asynchronous `load()` and `parse()` load their implementations through `preload()`. Synchronous parsing requires a parser-bearing format entry point:

```
import {parse, parseSync} from '@loaders.gl/core';

import {GeoTIFFRasterLoader} from '@loaders.gl/raster/geotiff';

import {QuantizedMeshLoader} from '@loaders.gl/raster/terrain';

import {QuantizedMeshLoaderWithParser} from '@loaders.gl/raster/quantized-mesh/bundled';



const raster = await parse(tiffBytes, GeoTIFFRasterLoader);

const terrain = parseSync(terrainBytes, QuantizedMeshLoaderWithParser);
```

Import parsers directly from `/geotiff/parser`, `/geotiff/raster-parser`, `/lerc/parser`, `/terrain/parser`, and `/quantized-mesh/parser`.

## Format entry points[​](#format-entry-points "Direct link to Format entry points")

| Logo                                                                                                                  | Entry point                            | Implementation                                    |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`           | GeoTIFF image and numeric raster parsers          |
| —                                                                                                                     | `@loaders.gl/raster/lerc`              | LERC parser                                       |
| —                                                                                                                     | `@loaders.gl/raster/terrain`           | Image-encoded elevation to terrain mesh           |
| —                                                                                                                     | `@loaders.gl/raster/quantized-mesh`    | Quantized mesh parser                             |
| —                                                                                                                     | `@loaders.gl/raster/terrain/heightmap` | Heightmap decoding, sampling, and surface helpers |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`           | Synchronous GeoTIFF/COG source constructor        |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`           | Synchronous OME-TIFF source constructor           |

GeoTIFF and OME-TIFF source metadata is available from `@loaders.gl/raster/geotiff`. Use asynchronous `createDataSource()` with metadata or import an explicit source implementation for synchronous `createDataSourceSync()`. Use the named source, discovery, and heightmap subpaths for advanced APIs; their references list the exported constructors and helpers.

## Rendering with deck.gl[​](#rendering-with-deckgl "Direct link to Rendering with deck.gl")

* [RasterSourceLayer](https://loaders.gl/docs/modules/raster/api-reference/raster-source-layer.md) requests a raster for the current viewport.
* [RasterBitmapLayer](https://loaders.gl/docs/modules/raster/api-reference/raster-bitmap-layer.md) draws a single-band raster with GPU styling.

## Optional decoder packages[​](#optional-decoder-packages "Direct link to Optional decoder packages")

Install `geotiff` for the GeoTIFF image parser, GeoTIFF/COG source, and OME-TIFF source:

```
npm install geotiff
```

The native numeric `GeoTIFFRasterLoader` defaults to its built-in decoder. Install `geotiff` when explicitly selecting the `geotiff` backend or when automatic decoding falls back to it. Use `geotiff: {decoder: 'native'}` to require native decoding without a compatibility fallback.

Install `lerc` for `LERCLoader`:

```
npm install lerc
```

Both engines are optional peer dependencies. Terrain and quantized mesh do not require them. LERC's WASM is shipped at `@loaders.gl/raster/lerc/lerc-wasm.wasm`. Terrain workers are shipped at `@loaders.gl/raster/terrain-worker.js` and `@loaders.gl/raster/quantized-mesh-worker.js`.

The standalone GeoTIFF, LERC, and terrain packages have been removed. Loader IDs, format option names, default output shapes, and writer behavior are preserved; loader `module` is now `raster`.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/raster/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [GeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md)
* [LERC - Limited Error Raster Compression](https://loaders.gl/docs/modules/raster/lerc/formats/lerc.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->52<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                | Import subpath                                                |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`                                  |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/api`                              |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/bundled`                          |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/discover-geotiff`                 |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/load-geotiff`                 |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/load-ome-tiff`            |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/ome-indexers`             |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/ome-utils`                |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/omexml`                   |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/utils`                    |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff-pixel-source`            |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/decode-tiff-samples`     |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/geotiff-decoder-adapter` |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/geotiff-source-adapter`  |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/plan-tiff-blocks`        |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/read-tiff-directory`     |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-gdal-metadata`      |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-metadata`           |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-numeric-decoder`    |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-source-decoder`     |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-types`              |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/utils/tiff-utils`             |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/loaders`                          |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/parser`                           |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/raster-parser`                    |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/types`                            |
|                                                                                                                       | `@loaders.gl/raster/lerc`                                     |
|                                                                                                                       | `@loaders.gl/raster/lerc-wasm-url`                            |
|                                                                                                                       | `@loaders.gl/raster/lerc/api`                                 |
|                                                                                                                       | `@loaders.gl/raster/lerc/bundled`                             |
|                                                                                                                       | `@loaders.gl/raster/lerc/lerc-wasm.wasm`                      |
|                                                                                                                       | `@loaders.gl/raster/lerc/lib/parsers/lerc/lerc-types`         |
|                                                                                                                       | `@loaders.gl/raster/lerc/parser`                              |
|                                                                                                                       | `@loaders.gl/raster/quantized-mesh`                           |
|                                                                                                                       | `@loaders.gl/raster/quantized-mesh-worker.js`                 |
|                                                                                                                       | `@loaders.gl/raster/quantized-mesh/bundled`                   |
|                                                                                                                       | `@loaders.gl/raster/quantized-mesh/parser`                    |
|                                                                                                                       | `@loaders.gl/raster/terrain`                                  |
|                                                                                                                       | `@loaders.gl/raster/terrain-worker.js`                        |
|                                                                                                                       | `@loaders.gl/raster/terrain/api`                              |
|                                                                                                                       | `@loaders.gl/raster/terrain/bundled`                          |
|                                                                                                                       | `@loaders.gl/raster/terrain/heightmap`                        |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/decode-quantized-mesh`        |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/decode-terrain-heightmap`     |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/delatin`                      |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/helpers/skirt`                |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/parse-quantized-mesh`         |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/parse-terrain`                |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/terrain-contracts`            |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/terrain-heightmap-types`      |
|                                                                                                                       | `@loaders.gl/raster/terrain/lib/utils/version`                |
|                                                                                                                       | `@loaders.gl/raster/terrain/parser`                           |
