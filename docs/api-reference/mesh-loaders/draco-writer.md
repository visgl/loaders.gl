# DracoEncoder (@loaders.gl/draco)

Encodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.


| Loader                     | Characteristic |
| ---                        | ---            |
| File Extension             | `.drc`         |
| File Typoe                 | Binary         |
| File Format                | [Draco](https://google.github.io/draco/) |
| Data Format                | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md) |
| Encoder Type               | Synchronous    |
| Worker Thread Support      | Yes            |
| Streaming Support          | No             |


## Usage

```
import {DracoWriter} from `@loaders.gl/draco';
import {writeFile} from '@loaders.gl/core';

const data = await writeFile(url, DracoWriter, options);
```

## Options

- `method`=`MESH_EDGEBREAKER_ENCODING` (String) - set Draco encoding method (applies to meshes only)
- `speed`=`[5, 5]` ([Number, Number] - set Draco speed options.
- `quantization`=`{POSITION: 10}` (Object) - set Draco attribute quantization.
- `log`= (Function) - callback for debug info.

## Attribution/Credits

Based on Draco examples