# Tile3DLoader

> The 3D tile loaders are still under development. If you are interested in early access, please open an issue.

Parses a [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles). glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.

| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extensions       | `.b3dm`,`.i3dm`, `.pnts`, `.cmpt` |
| File Types            | Binary (with linked assets) |
| Input Format           | [glTF](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tile-format-specifications)    |
| Output Format       | [Scenegraph](/docs/specifications/category-scenegraph) |
| Decoder Type          | Synchronous (limited), Asynchronous |
| Worker Thread Support | No              |
| Streaming Support     | No \*           |

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

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `fetchLinkedResources` | Boolean | `true`      | Fetch any linked .BIN files, decode base64 encoded URIS. Only supported in asynchronous parsing. |
| `fetch`              | Function  | `fetch` | Function used to fetch linked resources. |
| `decompress`         | Boolean | `true`      | Decompress Draco compressed meshes (if DracoLoader available). |
| `DracoLoader`        | [DracoLoader](/docs/api-reference/draco/draco-loader)  | `null`      | Supply to enable decoding of Draco compressed meshes. |
| `postProcess`        | Boolean | `false`     | Perform additional post processing to simplify use in WebGL libraries. |
| `createImages`       | Boolean  | `false`     | Create image objects from loaded image data. |
