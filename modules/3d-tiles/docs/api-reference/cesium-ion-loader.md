# CesiumIonLoader

> Extends from `Tiles3DLoader`, inherits all the options and share the same resolved `Tileset` and `Tile` format.
> Along with the support of resolving tileset metadata and authorization from Cesium ION server.

Parse [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles) fetched from Cesium ION server.

## Usage

Load a tileset file from Cesium ION server.

```js
import {load} from '@loaders.gl/core';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';
const tilesetUrl = 'https://assets.cesium.com/43978/tileset.json';
const ION_ACCESS_TOKEN = ''; // your own ion access token

const options = {ion: {loadGLTF: true}};
// resolve the authorizations used for requesting tiles from ION server
const metadata = CesiumIonLoader.preload(tilesetUrl, {accessToken: ION_ACCESS_TOKEN});
console.log(metadata);
const tilesetJson = await load(tilesetUrl, CesiumIonLoader, {...options, ...metadata});
```

## Options

Inherit all the options from `Tiles3DLoader`.

| Option          | Type   | Default | Description                                                                            |
| --------------- | ------ | ------- | -------------------------------------------------------------------------------------- |
| `ion.isTileset` | Bool   | `false` | Whether to load a `Tileset` file. If not specifies, will infer based on url extension. |
| `ion.headers`   | Object | null    | Used to load data from server                                                          |

To enable parsing of DRACO compressed point clouds and glTF tiles, make sure to first register the [DracoLoader](/docs/api-reference/draco/draco-loader).

Point cloud tie options

| Option                         | Type      | Default | Description                          |
| ------------------------------ | --------- | ------- | ------------------------------------ |
| `ion.decodeQuantizedPositions` | `Boolean` | `false` | Pre-decode quantized position on CPU |

For i3dm and b3dm tiles:

| Option         | Type    | Default | Description                           |
| -------------- | ------- | ------- | ------------------------------------- |
| `ion.loadGLTF` | Boolean | `true`  | Fetch and parse any linked glTF files |

If `options.ion.loadGLTF` is `true`, GLTF loading can be controlled by providing [`GLTFLoader` options](modules/gltf/docs/api-reference/gltf-loader.md) via the `options.gltf` sub options.

## Data formats

The same as `Tiles3DLoader`.
