# @loaders.gl/raster

GeoTIFF, numeric TIFF, OME-TIFF, LERC, image-encoded terrain, and quantized mesh.

```
npm install @loaders.gl/core @loaders.gl/raster
```

The root exports metadata loaders. Asynchronous `load()` and `parse()` load their implementations through `preload()`. Synchronous parsing requires a parser-bearing format entry point:

```
import {parse, parseSync} from '@loaders.gl/core';

import {GeoTIFFRasterLoader, QuantizedMeshLoader} from '@loaders.gl/raster';

import {QuantizedMeshLoaderWithParser} from '@loaders.gl/raster/quantized-mesh';



const raster = await parse(tiffBytes, GeoTIFFRasterLoader);

const terrain = parseSync(terrainBytes, QuantizedMeshLoaderWithParser);
```

## Format entry points[​](#format-entry-points "Direct link to Format entry points")

| Logo                                                                                                                                 | Entry point                                | Implementation                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`               | GeoTIFF image and numeric raster parsers          |
| —                                                                                                                                    | `@loaders.gl/raster/lerc`                  | LERC parser                                       |
| —                                                                                                                                    | `@loaders.gl/raster/terrain`               | Image-encoded elevation to terrain mesh           |
| —                                                                                                                                    | `@loaders.gl/raster/quantized-mesh`        | Quantized mesh parser                             |
| —                                                                                                                                    | `@loaders.gl/raster/terrain/heightmap`     | Heightmap decoding, sampling, and surface helpers |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-source-loader` | Synchronous GeoTIFF/COG source constructor        |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/ometiff-source-loader` | Synchronous OME-TIFF source constructor           |

GeoTIFF and OME-TIFF source metadata is available from the root. Use asynchronous `load()` with metadata or import an explicit source implementation for synchronous `createDataSource()`. Use the named source, discovery, and heightmap subpaths for advanced APIs; their references list the exported constructors and helpers.

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

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/raster/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [GeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)
* [LERC - Limited Error Raster Compression](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->72<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                               | Import subpath                                                |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff`                                  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-loader`                           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-loader-types`                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-raster-loader`                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-raster-loader-types`              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-source-loader`                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff-source-loader-types`              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/bundled`                          |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/discover-geotiff`                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/geotiff-format`                   |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/geotiff-raster-types`             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/index`                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/load-geotiff`                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/load-ome-tiff`            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/ome-indexers`             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/ome-utils`                |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/omexml`                   |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/ome/utils`                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff-pixel-source`            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/decode-tiff-samples`     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/geotiff-decoder-adapter` |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/geotiff-source-adapter`  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/plan-tiff-blocks`        |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/read-tiff-directory`     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-gdal-metadata`      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-metadata`           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-numeric-decoder`    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-source-decoder`     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/tiff/tiff-types`              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/lib/utils/tiff-utils`             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/loaders`                          |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/types`                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md) | `@loaders.gl/raster/geotiff/unbundled`                        |
|                                                                                                                                      | `@loaders.gl/raster/index`                                    |
|                                                                                                                                      | `@loaders.gl/raster/lerc`                                     |
|                                                                                                                                      | `@loaders.gl/raster/lerc-loader`                              |
|                                                                                                                                      | `@loaders.gl/raster/lerc-loader-types`                        |
|                                                                                                                                      | `@loaders.gl/raster/lerc/bundled`                             |
|                                                                                                                                      | `@loaders.gl/raster/lerc/index`                               |
|                                                                                                                                      | `@loaders.gl/raster/lerc/lerc-format`                         |
|                                                                                                                                      | `@loaders.gl/raster/lerc/lerc-wasm-url`                       |
|                                                                                                                                      | `@loaders.gl/raster/lerc/lerc-wasm.wasm`                      |
|                                                                                                                                      | `@loaders.gl/raster/lerc/lib/parsers/lerc/lerc-types`         |
|                                                                                                                                      | `@loaders.gl/raster/lerc/unbundled`                           |
|                                                                                                                                      | `@loaders.gl/raster/ometiff-source-loader`                    |
|                                                                                                                                      | `@loaders.gl/raster/ometiff-source-loader-types`              |
|                                                                                                                                      | `@loaders.gl/raster/quantized-mesh`                           |
|                                                                                                                                      | `@loaders.gl/raster/quantized-mesh-loader`                    |
|                                                                                                                                      | `@loaders.gl/raster/quantized-mesh-loader-types`              |
|                                                                                                                                      | `@loaders.gl/raster/quantized-mesh-worker.js`                 |
|                                                                                                                                      | `@loaders.gl/raster/quantized-mesh-writer`                    |
|                                                                                                                                      | `@loaders.gl/raster/terrain`                                  |
|                                                                                                                                      | `@loaders.gl/raster/terrain-loader`                           |
|                                                                                                                                      | `@loaders.gl/raster/terrain-loader-types`                     |
|                                                                                                                                      | `@loaders.gl/raster/terrain-worker.js`                        |
|                                                                                                                                      | `@loaders.gl/raster/terrain/bundled`                          |
|                                                                                                                                      | `@loaders.gl/raster/terrain/heightmap`                        |
|                                                                                                                                      | `@loaders.gl/raster/terrain/index`                            |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/decode-quantized-mesh`        |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/decode-terrain-heightmap`     |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/delatin/index`                |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/helpers/skirt`                |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/parse-quantized-mesh`         |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/parse-terrain`                |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/terrain-contracts`            |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/terrain-height-field`         |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/terrain-height-grid`          |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/terrain-heightmap-types`      |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/terrain-neighborhood`         |
|                                                                                                                                      | `@loaders.gl/raster/terrain/lib/utils/version`                |
|                                                                                                                                      | `@loaders.gl/raster/terrain/terrain-format`                   |
|                                                                                                                                      | `@loaders.gl/raster/terrain/unbundled`                        |
