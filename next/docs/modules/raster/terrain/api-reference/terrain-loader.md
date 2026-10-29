Terrain module · loader API

# TerrainLoader

Decode RGB or grayscale elevation images into a renderable mesh or Mesh Arrow table, with control over bounds, error, skirts, and elevation decoding.

[Terrain module](https://loaders.gl/next/docs/modules/raster/terrain.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[QuantizedMeshLoader](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)

What it reconstructs

## Turn pixels that encode elevation into a surface.

TerrainLoader interprets image channels as elevation samples, places them within optional geographic bounds, and produces mesh data that can be rendered or passed through a columnar pipeline.

01

Input

RGB, grayscale, or raw terrain images

02

Decode

Channel scales and elevation offset

03

Output

Mesh or Mesh Arrow table

04

Detail

Error tolerance, bounds, and skirts

Detailed guide

## TerrainLoader reference

The sections below document supported inputs, output shapes, usage, elevation decoding, and loader options.

`TerrainLoader` reconstructs mesh surfaces from height map images, e.g. [Mapzen Terrain Tiles](https://github.com/tilezen/joerd/blob/master/docs/formats.md), which encodes elevation into R,G,B values. It returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default. Set `terrain.shape: 'mesh'` for the legacy [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) object.

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

| TerrainLoader     |                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Extension    | `.png`, `.pngraw`                                                                                                                                                                  |
| File Type         | Binary                                                                                                                                                                             |
| File Format       | Encoded height map                                                                                                                                                                 |
| Data Format       | [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables), [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) |
| Supported APIs    | `load`, `parse`                                                                                                                                                                    |
| Decoder Type      | Asynchronous                                                                                                                                                                       |
| Worker Thread     | ✅ Yes                                                                                                                                                                             |
| Streaming Support | ❌ No                                                                                                                                                                              |

## Usage[​](#usage "Direct link to Usage")

```
import {TerrainLoader} from '@loaders.gl/raster';

import {load} from '@loaders.gl/core';



const data = await load(url, TerrainLoader, options);

const table = await load(url, TerrainLoader, {

  worker: false,

  terrain: {...options.terrain, shape: 'arrow-table'}

});
```

`TerrainLoader` internally decodes heightmap images with [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md) and then converts them with `getImageData(image)`.

For [Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md) imagery, including Mapterhorn terrain WebP tiles, use the named preset:

```
import {TERRARIUM_ELEVATION_DECODER} from '@loaders.gl/raster/terrain/heightmap';



const terrain = await load(url, TerrainLoader, {

  terrain: {elevationDecoder: TERRARIUM_ELEVATION_DECODER}

});
```

If you only need elevation samples, use the lightweight [heightmap utilities](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/heightmap.md) instead of reconstructing a mesh.

## Options[​](#options "Direct link to Options")

| Option                     | Type            | Default       | Description                                                                                                                                   |
| -------------------------- | --------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `terrain.meshMaxError`     | `number`        | `10`          | Mesh error in meters. The output mesh is in higher resolution (more vertices) if the error is smaller.                                        |
| `terrain.bounds`           | `array<number>` | `null`        | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. If not supplied, x and y are in pixels relative to the image. |
| `terrain.elevationDecoder` | `object`        | See below     | See below                                                                                                                                     |
| `terrain.tesselator`       | `string`        | `auto`        | See below                                                                                                                                     |
| `terrain.shape`            | `string`        | `arrow-table` | Output shape: `'arrow-table'` or `'mesh'`.                                                                                                    |
| `terrain.skirtHeight`      | `number`        | `null`        | If set, create the skirt for the tile with particular height in meters                                                                        |

### elevationDecoder[​](#elevationdecoder "Direct link to elevationDecoder")

Parameters used to convert a pixel to elevation in meters. An object containing the following fields:

* `rScaler`: Multiplier of the red channel.
* `gScaler`: Multiplier of the green channel.
* `bScaler`: Multiplier of the blue channel.
* `offset`: Translation of the sum.

Each color channel (r, g, and b) is a number between `[0, 255]`.

For example, the Mapbox terrain service's elevation is [encoded as follows](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/#decode-data):

```
height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
```

The corresponding `elevationDecoder` is:

```
{

  "rScaler": 6553.6,

  "gScaler": 25.6,

  "bScaler": 0.1,

  "offset": -10000

}
```

The default value of `elevationDecoder` decodes a grayscale image:

```
{

  "rScaler": 1,

  "gScaler": 0,

  "bScaler": 0,

  "offset": 0

}
```

### tesselator[​](#tesselator "Direct link to tesselator")

The choices for tesselator are as follows:

`auto`:

* Chooses [Martini](https://github.com/mapbox/martini) if possible (if the image is a square where both height and width are powers of 2), otherwise uses [Delatin](https://github.com/mapbox/delatin) instead, which has no input image limitations.

`martini`:

* Uses the [Martini](https://github.com/mapbox/martini) algorithm for constructing a mesh.
* Only works on square 2^n+1 x 2^n+1 grids.
* Generates a hierarchy of meshes (pick arbitrary detail after a single run)
* Optimized for meshing speed rather than quality.

`delatin`:

* Uses the [Delatin](https://github.com/mapbox/delatin) algorithm for constructing a mesh.
* Works on arbitrary raster grids.
* Generates a single mesh for a particular detail.
* Optimized for quality (as little triangles as possible for a given error).
