# QuantizedMeshLoader

The `@loaders.gl/quantized-mesh` module reconstructs mesh surfaces from the [quantized mesh](https://github.com/CesiumGS/quantized-mesh) format.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.terrain`                                    |
| File Type             | Binary                                        |
| File Format           | Encoded mesh                                  |
| Data Format           | [Mesh](/docs/specifications/category-mesh.md) |
| Decoder Type          | Asynchronous                                  |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```js
import {QuantizedMeshLoader} from '@loaders.gl/quantized-mesh';
import {load} from '@loaders.gl/core';

const data = await load(url, QuantizedMeshLoader, options);
```

## Options

| Option                     | Type          | Default        | Description                                                                     |
| -------------------------- | ------------- | -------------- | ------------------------------------------------------------------------------- |
| `quantized-mesh.bounds`    | array<number> | `[0, 0, 1, 1]` | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. |
| `quantized-mesh.workerUrl` | string        |                | Custom worker url. Defaults to the unpkg CDN.                                   |
