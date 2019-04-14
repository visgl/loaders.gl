# Tile3DLoader (Experimental)

Parses a [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles). glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.

| Loader                | Characteristic                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.b3dm`,`.i3dm`, `.pnts`, `.cmpt`                                                                              |
| File Types            | Binary (with linked assets)                                                                                    |
| File Format           | [glTF](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tile-format-specifications) |
| Format Category       | 3D Tile                                                                                                        |
| Parser Type           | Asynchronous (Synchronous w/ limited functionality)                                                            |
| Worker Thread Support | No                                                                                                             |
| Streaming Support     | No (not for invididual tiles, however tilesets are streamed by loading only the tiles needed for the current view |

## Usage

```
import {load} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
const gltf = await load(url, Tile3DLoader);
```

To decompress tiles containing Draco compressed glTF models or Draco compressed point clouds:

```
import {load} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';
const gltf = load(url, Tile3DLoader, {DracoLoader, decompress: true});
```

## Options

- `DracoEncoder` - supply this to enable decoding of Draco compressed meshes. `import {DracoEncoder} from '@loaders.gl/draco'`

## Options

| Option                 | Default     | Description                                                                                      |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `fetchLinkedResources` | `true`      | Fetch any linked .BIN files, decode base64 encoded URIS. Only supported in asynchronous parsing. |
| `fetch`                | `fetchFile` | Function used to fetch linked resources                                                          |
| `decompress`           | `true`      | Decompress Draco compressed meshes (if DracoLoader available)                                   |
| `DracoLoader`         | `null`      | Supply to enable decoding of Draco compressed meshes.                                            |
| `postProcess`          | `false`     | Perform additional post processing to simplify use in WebGL libraries                            |
| `createImages`         | `false`     | Create image objects from loaded image data                                                      |

## Structure of Loaded Data

Returns a JSON object with "embedded" binary data in the form of typed javascript arrays.

When parsed asynchronously (i.e. not using `parseSync`):

- linked binary resources will be loaded and resolved (if url is available).
- base64 encoded binary data inside the JSON payload will be decoded

## Attributions

The `Tile3DLoader` is a fork of 3d tile related code in Cesium (https://github.com/AnalyticalGraphicsInc/cesium) under Apache 2 License, in collabration with Sean Lilley and Patrick Cozzi at Cesium.
