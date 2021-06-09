# CesiumIonLoader

> Extends from `Tiles3DLoader`, inherits all the options and share the same resolved `Tileset` and `Tile` format.
> Along with the support of resolving tileset metadata and authorization from Cesium ion server.

Parse [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles) fetched from Cesium ion server.

## Usage

Load a tileset file from Cesium ion server.

```js
import {load} from '@loaders.gl/core';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';
import {WebMercatorViewport} from '@deck.gl/core';
const tilesetUrl = 'https://assets.cesium.com/43978/tileset.json';
const ION_ACCESS_TOKEN = ''; // your own ion access token

const options = {ion: {loadGLTF: true}};
// resolve the authorizations used for requesting tiles from Cesium ion server
const metadata = CesiumIonLoader.preload(tilesetUrl, {accessToken: ION_ACCESS_TOKEN});
console.log(metadata);

const tilesetJson = await load(tilesetUrl, CesiumIonLoader, {...options, ...metadata});

// If your tileset doesn't have .json extension, set options['cesium-ion'].isTileset to true
const tilesetJson = await load(tilesetUrl, CesiumIonLoader, {
  ...options,
  ...metadata,
  isTileset: true
});

const viewport = new WebMercatorViewport({latitude, longitude, zoom});
tileset3d.update(viewport);

// visible tiles
const visibleTiles = tileset3d.tiles.filter((tile) => tile.selected);
// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks
```

## Options

Inherit all the options from `Tiles3DLoader`.

| Option                     | Type           | Default | Description                                                                                                                                                           |
| -------------------------- | -------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `['cesium-ion'].isTileset` | Bool or `auto` | `auto`  | Whether to load a `Tileset` file. If `auto`, will infer based on url extension.                                                                                       |
| `['cesium-ion'].headers`   | Object         | `null`  | Used to load data from server                                                                                                                                         |
| `['cesium-ion'].tileset`   | `Object`       | `null`  | `Tileset` object loaded by `Tiles3DLoader` or follow the data format specified in [Tileset Object](#tileset-object). It is required when loading i3s geometry content |
| `['cesium-ion'].tile`      | `Object`       | `null`  | `Tile` object loaded by `Tiles3DLoader` or follow the data format [Tile Object](#tile-object). It is required when loading i3s geometry content                       |

To enable parsing of DRACO compressed point clouds and glTF tiles, make sure to first register the [DracoLoader](/docs/api-reference/draco/draco-loader).

Point cloud tie options

| Option                                   | Type      | Default | Description                          |
| ---------------------------------------- | --------- | ------- | ------------------------------------ |
| `['cesium-ion'].decodeQuantizedPosition` | `Boolean` | `false` | Pre-decode quantized position on CPU |

For i3dm and b3dm tiles:

| Option                    | Type    | Default | Description                           |
| ------------------------- | ------- | ------- | ------------------------------------- |
| `['cesium-ion'].loadGLTF` | Boolean | `true`  | Fetch and parse any linked glTF files |

If `options['cesium-ion'].loadGLTF` is `true`, GLTF loading can be controlled by providing [`GLTFLoader` options](modules/gltf/docs/api-reference/gltf-loader.md) via the `options.gltf` sub options.

## Data formats

The same as `Tiles3DLoader`.
