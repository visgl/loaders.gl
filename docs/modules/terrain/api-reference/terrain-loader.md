# Terrain Loaders

The `TerrainArrowLoader` reconstructs mesh surfaces from height map images, e.g. [Mapzen Terrain Tiles](https://github.com/tilezen/joerd/blob/master/docs/formats.md), which encodes elevation into R,G,B values, and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

`TerrainLoader` parses the same height map terrain formats and returns the legacy [Mesh](/docs/specifications/category-mesh) object.

| Loader               | Output             | Use when                           |
| -------------------- | ------------------ | ---------------------------------- |
| `TerrainLoader`      | `Mesh`             | You want the legacy mesh object.   |
| `TerrainArrowLoader` | `Mesh Arrow table` | You want columnar mesh attributes. |

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.png`, `.pngraw`                          |
| File Type             | Binary                                     |
| File Format           | Encoded height map                         |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| Supported APIs        | `load`, `parse`                            |
| Decoder Type          | Asynchronous                               |
| Worker Thread Support | Yes                                        |
| Streaming Support     | No                                         |

## Usage

```typescript
import {TerrainArrowLoader, TerrainLoader} from '@loaders.gl/terrain';
import {load} from '@loaders.gl/core';

const table = await load(url, TerrainArrowLoader, options);
const data = await load(url, TerrainLoader, options);
```

`TerrainLoader` internally decodes heightmap images with [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) and then converts them with `getImageData(image)`.

### Fixed grid loader example

Use the fixed grid tesselator when you want deterministic mesh density and longitude/latitude output positions for a terrain tile:

```typescript
import {load} from '@loaders.gl/core';
import {TerrainLoader} from '@loaders.gl/terrain';

const terrainMesh = await load('https://example.com/terrain-rgb.png', TerrainLoader, {
  terrain: {
    tesselator: 'grid',
    gridSize: 33,
    bounds: [-122.523, 37.649, -122.356, 37.815], // [west, south, east, north]
    skirtHeight: 20,
    elevationDecoder: {
      rScaler: 65536 * 0.1,
      gScaler: 256 * 0.1,
      bScaler: 0.1,
      offset: -10000
    }
  }
});
```

With `terrain.tesselator = 'grid'`, the returned mesh contains:

- `POSITION` attributes as `[longitude, latitude, elevation]`
- `TEXCOORD_0` attributes aligned with the source image
- indexed triangle-list geometry with a stable vertex count of `gridSize * gridSize`

### Direct mesh API example

If you already have decoded height-map bytes, you can bypass image loading and build the mesh directly:

```typescript
import {makeGridTerrainMesh} from '@loaders.gl/terrain';

const terrainMesh = makeGridTerrainMesh(
  {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength)
  },
  {
    bounds: [-122.523, 37.649, -122.356, 37.815],
    gridSize: 33,
    skirtHeight: 20,
    elevationDecoder: {
      rScaler: 65536 * 0.1,
      gScaler: 256 * 0.1,
      bScaler: 0.1,
      offset: -10000
    }
  }
);
```

## Options

| Option                     | Type            | Default   | Description                                                                                                                                   |
| -------------------------- | --------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `terrain.meshMaxError`     | `number`        | `10`      | Mesh error in meters. The output mesh is in higher resolution (more vertices) if the error is smaller.                                        |
| `terrain.bounds`           | `array<number>` | `null`    | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. If not supplied, x and y are in pixels relative to the image. |
| `terrain.elevationDecoder` | `object`        | See below | See below                                                                                                                                     |
| `terrain.tesselator`       | `string`        | `auto`    | See below                                                                                                                                     |
| `terrain.gridSize`         | `number`        | `33`      | Vertices per side when `terrain.tesselator` is `grid`.                                                                                        |
| `terrain.skirtHeight`      | `number`        | `null`    | If set, create the skirt for the tile with particular height in meters                                                                        |

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

`grid`:

- Builds a fixed-resolution indexed triangle grid directly from the height map.
- Uses `terrain.gridSize` to control vertices per side. The default `33` produces 1089 vertices and 2048 triangles per tile. `terrain.meshMaxError` is ignored by this fixed-resolution path.
- Requires `terrain.bounds` as longitude and latitude degrees ordered `[west, south, east, north]`.
- Emits `POSITION` attributes as `[longitude, latitude, elevation]`, which lets deck.gl `TerrainLayer` render the same mesh in `COORDINATE_SYSTEM.LNGLAT` across map and globe projections.
- Samples rows uniformly in Mercator y so high-latitude terrain tiles avoid the stretching produced by latitude-uniform sampling.
