# DracoWriter

The `DracoWriter` encodes a mesh or point cloud using [Draco](https://google.github.io/draco/) compression.

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Extension | `.drc`                                       |
| File Type      | Binary                                       |
| File Format    | [Draco](https://google.github.io/draco/)     |
| Data Format    | [Mesh](docs/specifications/category-mesh.md) |
| Support API    | `encode`                                     |

## Usage

```js
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';

const data = encode(url, DracoWriter, options);
```

## Options

| Option               | Type               | Default | Description                                                                         |
| -------------------- | ------------------ | ------- | ----------------------------------------------------------------------------------- |
| `draco.pointcloud`   | `Boolean`          | `false` | Whether to compress as point cloud (GL.POINTS)                                      |
| `draco.speed`        | `Number`           |         | Speed vs Quality, see [Draco](https://google.github.io/draco/) documentation        |
| `draco.method`       | `String`           |         | Compression method, see [Draco](https://google.github.io/draco/) documentation      |
| `draco.quantization` | `[Number, Number]` |         | Quantization parameters, see [Draco](https://google.github.io/draco/) documentation |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.
