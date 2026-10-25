# @loaders.gl/raster

GeoTIFF, numeric TIFF, OME-TIFF, LERC, image-encoded terrain, and quantized mesh.

```sh
npm install @loaders.gl/core @loaders.gl/raster
```

The root exports metadata loaders. Asynchronous `load()` and `parse()` load their implementations
through `preload()`. Synchronous parsing requires a parser-bearing format entry point:

```ts
import {parse, parseSync} from '@loaders.gl/core';
import {GeoTIFFRasterLoader, QuantizedMeshLoader} from '@loaders.gl/raster';
import {QuantizedMeshLoaderWithParser} from '@loaders.gl/raster/quantized-mesh';

const raster = await parse(tiffBytes, GeoTIFFRasterLoader);
const terrain = parseSync(terrainBytes, QuantizedMeshLoaderWithParser);
```

## Format entry points

| Entry point | Implementation |
| --- | --- |
| `@loaders.gl/raster/geotiff` | GeoTIFF image and numeric raster parsers |
| `@loaders.gl/raster/lerc` | LERC parser |
| `@loaders.gl/raster/terrain` | Image-encoded elevation to terrain mesh |
| `@loaders.gl/raster/quantized-mesh` | Quantized mesh parser |
| `@loaders.gl/raster/terrain/heightmap` | Heightmap decoding, sampling, and surface helpers |
| `@loaders.gl/raster/geotiff/geotiff-source-loader` | Synchronous GeoTIFF/COG source constructor |
| `@loaders.gl/raster/geotiff/ometiff-source-loader` | Synchronous OME-TIFF source constructor |

GeoTIFF and OME-TIFF source metadata is available from the root. Use asynchronous `load()`
with metadata or import an explicit source implementation for synchronous `createDataSource()`.
The format `*/index` paths retain the existing advanced format APIs.

## Optional decoder packages

Install `geotiff` for the GeoTIFF image parser, GeoTIFF/COG source, and OME-TIFF source:

```sh
npm install geotiff
```

The native numeric `GeoTIFFRasterLoader` defaults to its built-in decoder. Install `geotiff`
when explicitly selecting the `geotiff` backend or when automatic decoding falls back to it.
Use `geotiff: {decoder: 'native'}` to require native decoding without a compatibility fallback.

Install `lerc` for `LERCLoader`:

```sh
npm install lerc
```

Both engines are optional peer dependencies. Terrain and quantized mesh do not require them.
LERC's WASM is shipped at `@loaders.gl/raster/lerc/lerc-wasm.wasm`.
Terrain workers are shipped at `@loaders.gl/raster/terrain-worker.js` and
`@loaders.gl/raster/quantized-mesh-worker.js`.

The standalone GeoTIFF, LERC, and terrain packages have been removed. Loader IDs, format option
names, default output shapes, and writer behavior are preserved; loader `module` is now `raster`.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
