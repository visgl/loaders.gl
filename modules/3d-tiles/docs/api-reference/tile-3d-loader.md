# Tile3DLoader

Parses a [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles).

| Loader                | Characteristic                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.b3dm`,`.i3dm`, `.pnts`, `.cmpt`                                                                              |
| File Type             | Binary (with linked assets)                                                                                    |
| File Format           | [glTF](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tile-format-specifications) |
| Data Format           | [Scenegraph](/docs/specifications/category-scenegraph)                                                         |
| Decoder Type          | Synchronous (limited), Asynchronous                                                                            |
| Worker Thread Support | No                                                                                                             |
| Streaming Support     | No \*                                                                                                          |

\* Streaming is not supported for invididual tiles, however tilesets are streamed by loading only the tiles needed for the current view.

## Usage

```js
import {load} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
const gltf = await load(url, Tile3DLoader);
```

To decompress tiles containing Draco compressed glTF models or Draco compressed point clouds:

```js
import {load} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';
const gltf = await load(url, Tile3DLoader, {DracoLoader, decompress: true});
```

## Options

To enable parsing of DRACO compressed point clouds and glTF tiles, make sure to first register a [DracoLoader](/docs/api-reference/draco/draco-loader). The `DracoWorkerLoader` will usually give best loading performance and interactivity.

Point cloud tie options

| Option                              | Type      | Default | Description                          |
| ----------------------------------- | --------- | ------- | ------------------------------------ |
| `3d-tiles.decodeQuantizedPositions` | `Boolean` | `false` | Pre-decode quantized position on CPU |
| `3d-tiles.decodeQuantizedPositions` | `Boolean` | `false` | Pre-decode quantized position on CPU |

For i3dm and b3dm tiles:

| Option              | Type    | Default | Description                           |
| ------------------- | ------- | ------- | ------------------------------------- |
| `3d-tiles.loadGLTF` | Boolean | `true`  | Fetch and parse any linked glTF files |

If `options['3d-tiles'].loadGLTF` is `true`, GLTF loading can be controlled by providing [`GLTFLoader` options](modules/gltf/docs/api-reference/gltf-loader.md) via the `options.gltf` sub options.

## Notes about Tile Types

### b3dm, i3dm

glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.
