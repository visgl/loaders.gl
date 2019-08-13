# Tileset3DLoader

> The 3D tile loaders are still under development.

Parses a main tileset JSON file as the entry point to define a 3D tileset.

| Loader                | Characteristic   |
| --------------------- | ---------------- |
| File Extensions       | `.json`          |
| File Type             | JSON             |
| File Format           | [3D Tileset JSON](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tileset-json) |
| Data Format           | JSON             |
| Decoder Type          | Synchronous      |
| Worker Thread Support | No               |
| Streaming Support     | No               |

## Usage

```js
import {Tileset3DLoader, Tileset3D} from '^loaders.gl/3d-tiles';
const tilesetJson = await load('http://localhost:8002/tilesets/Seattle/tileset.json', Tileset3DLoader);
const tileset = new Tileset3D(tilesetJson);
```

## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
