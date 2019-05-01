# DracoLoader

Decodes a mesh or point cloud (maps of attributes) using [DRACO compression](https://google.github.io/draco/) compression.

| Loader                | Characteristic                                                        |
| --------------------- | --------------------------------------------------------------------- |
| File Extension        | `.drc`                                                                |
| File Type             | Binary                                                                |
| File Format           | [Draco](https://google.github.io/draco/)                              |
| Parser Category       | [Standardized Mesh](docs/api-reference/mesh-loaders/category-mesh.md) |
| Parser Type           | Synchronous                                                           |
| Worker Thread Support | Yes                                                                   |
| Streaming Support     | No                                                                    |

## Usage

```js
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const data = await load(url, DracoLoader, options);
```

## Options

N/A

## Data Format

`DracoLoader` loads a single primitive geometry for a point cloud or mesh and the return data follows the conventions for those categories.

## Attribution/Credits

Based on Draco examples
