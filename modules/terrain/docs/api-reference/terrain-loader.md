# TerrainLoader

The `TerrainLoader` reconstructs mesh surfaces from height map images, e.g. [Mapzen Terrain Tiles](https://github.com/tilezen/joerd/blob/master/docs/formats.md), which encodes elevation into R,G,B values.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.png`, `.pngraw`                             |
| File Type             | Binary                                        |
| File Format           | Encoded height map                            |
| Data Format           | [Mesh](/docs/specifications/category-mesh.md) |
| Supported APIs        | `load`, `parse`                               |
| Decoder Type          | Asynchronous                                  |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```js
import {ImageLoader} from '@loaders.gl/images';
import {TerrainLoader} from '@loaders.gl/terrain';
import {load, registerLoaders} from '@loaders.gl/core';

registerLoaders(ImageLoader);

const data = await load(url, TerrainLoader, options);
```

## Options

| Option                     | Type            | Default   | Description                                                                                                                                   |
| -------------------------- | --------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `terrain.meshMaxError`     | `number`        | `10`      | Mesh error in meters. The output mesh is in higher resolution (more vertices) if the error is smaller.                                        |
| `terrain.bounds`           | `array<number>` | `null`    | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. If not supplied, x and y are in pixels relative to the image. |
| `terrain.elevationDecoder` | `object`        | See below | See below                                                                                                                                     |
| `terrain.tesselator`       | `string`        | `auto`    | See below                                                                                                                                     |

### elevationDecoder

Parameters used to convert a pixel to elevation in meters.
An object containing the following fields:

- `rScale`: Multiplier of the red channel.
- `gScale`: Multiplier of the green channel.
- `bScale`: Multiplier of the blue channel.
- `offset`: Translation of the sum.

Each color channel (r, g, and b) is a number between `[0, 255]`.

For example, the Mapbox terrain service's elevation is [encoded as follows](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/#decode-data):

```
height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
```

The corresponding `elevationDecoder` is:

```
{
  "rScale": 6553.6,
  "gScale": 25.6,
  "bScale": 0.1,
  "offset": -10000
}
```

The default value of `elevationDecoder` decodes a grayscale image:

```
{
  "rScale": 1,
  "gScale": 0,
  "gScale": 0,
  "offset": 0
}
```

### tesselator

The choices for tesselator are as follows:

`auto`:

- Chooses [Martini](https://github.com/mapbox/martini) if possible (if the image is a square where both height and width are powers of 2), otherwise uses [Delatin](https://github.com/mapbox/delatin) instead, which has no input image limitations.

`martini`:

- Uses the [Martini](https://github.com/mapbox/martini) algorithm for constructing a mesh.
- Only works on square 2^n+1 x 2^n+1 grids.
- Generates a hierarchy of meshes (pick arbitrary detail after a single run)
- Optimized for meshing speed rather than quality.

`delatin`:

- Uses the [Delatin](https://github.com/mapbox/delatin) algorithm for constructing a mesh.
- Works on arbitrary raster grids.
- Generates a single mesh for a particular detail.
- Optimized for quality (as little triangles as possible for a given error).
