# Tileset3DLoader

> The 3D tile loaders are still under development.

Parses a main tileset JSON file as the entry point to define a 3D tileset.

| Loader                | Characteristic                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| File Extensions       | `.json`                                                                                                     |
| File Type             | JSON                                                                                                        |
| File Format           | [3D Tileset JSON](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tileset-json) |
| Data Format           | JSON                                                                                                        |
| Decoder Type          | Synchronous                                                                                                 |
| Worker Thread Support | No                                                                                                          |
| Streaming Support     | No                                                                                                          |

## Usage

```js
import {Tileset3DLoader} from '@loaders.gl/3d-tiles';

// 3d-tiles
let tilesetJson = await load(
  'http://localhost:8002/tilesets/Seattle/tileset.json',
  Tileset3DLoader,
  options
);

console.log(tilesetJson);

import {I3STilesetLoader} from '@loaders.gl/i3s';

// i3s
tilesetJson = await load(
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
  I3STilesetLoader,
  options
);

console.log(tilesetJson);
```

## Options

| Option                   | Type    | Default | Description                                    |
| ------------------------ | ------- | ------- | ---------------------------------------------- |
| loadGLTF                 | boolean | true    | Whether to load and parse gltf from the tiles  |
| decodeQuantizedPositions | boolean | false   | Whether to decompress quantized positions data |

## Loaded Fields

Loaded fields will contain the result from browser `fetch` from given url. And the following fields are guaranteed.

- `root`: the root node of the tileset.
