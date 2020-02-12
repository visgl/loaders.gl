# TerrainLoader

The `TerrainLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.png`, `.pngraw`                             |
| File Type             | Binary                                        |
| File Format           | Encoded height map                            |
| Data Format           | [Mesh](/docs/specifications/category-mesh.md) |
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

| Option                     | Type          | Default   | Description                                                                                                                                   |
| -------------------------- | ------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `terrain.meshMaxError`     | number        | `10`      | Mesh error in meters. The output mesh is in higher resolution (more vertices) if the error is smaller.                                        |
| `terrain.bounds`           | array<number> | `null`    | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. If not supplied, x and y are in pixels relative to the image. |
| `terrain.elevationDecoder` | object        | See below | See below                                                                                                                                     |

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
