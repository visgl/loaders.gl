# DracoLoader (@loaders.gl/draco)

Decodes a mesh or point cloud (maps of attributes) using [DRACO compression](https://google.github.io/draco/) compression.

| Loader                     | Characteristic |
| ---                        | ---            |
| File Extension             | `.drc`         |
| File Type                  | Binary         |
| File Format                | [Draco](https://google.github.io/draco/) |
| Parser Category            | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md) |
| Parser Type                | Synchronous    |
| Worker Thread Support      | Yes            |
| Streaming Support          | No             |


## Usage

```
import {DracoLoader} from `@loaders.gl/draco';
import {loadFile} from '@loaders.gl/core';

const data = await loadFile(url, DracoLoader, options);
```

## Options

N/A

## Structure of Loaded Data

`DracoLoader` loads a single primitive geometry for a point cloud or mesh and the return data follows the conventions for those categories.

## Attribution/Credits

Based on Draco examples
