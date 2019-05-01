# DracoWriter

Encodes a mesh or point cloud (maps of attributes) using [Draco3D](https://google.github.io/draco/) compression.

| Loader                | Characteristic                                                        |
| --------------------- | --------------------------------------------------------------------- |
| File Extension        | `.drc`                                                                |
| File Typoe            | Binary                                                                |
| File Format           | [Draco](https://google.github.io/draco/)                              |
| Data Format           | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md) |
| Encoder Type          | Synchronous                                                           |
| Worker Thread Support | Yes                                                                   |
| Streaming Support     | No                                                                    |

## Usage

```js
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';

const mesh = {
  attributes: {
    POSITION: {...}
  }
};

const data = await encode(mesh, DracoWriter, options);
```

## Options

- `pointcloud`=`false` (Boolean): Set to `true` to compress pointclouds (mode=`0` and no `indices`)/
- `method`=`MESH_EDGEBREAKER_ENCODING` (String) - set Draco encoding method (applies to meshes only)
- `speed`=`[5, 5]` ([Number, Number] - set Draco speed options.
- `quantization`=`{POSITION: 10}` (Object) - set Draco attribute quantization. Lower numbers means higher compression but more information loss.
- `log`= (Function) - callback for debug info.

## Input Data

Accepts a standardized mesh.

## Attribution/Credits

Based on Draco examples
