# OBJLoader

The `OBJLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format.

| Loader                | Characteristic                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| File Extension        | `.obj`                                                                  |
| File Type             | Text                                                                    |
| File Format           | [Wavefront OBJ file](https://en.wikipedia.org/wiki/Wavefront_.obj_file) |
| Data Format           | [Mesh](docs/specifications/category-mesh.md)                            |
| Decoder Type          | Synchronous                                                             |
| Worker Thread Support | Yes                                                                     |
| Streaming Support     | No                                                                      |

## Usage

```js
import {OBJLoader, OBJWorkerLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

// Decode on main thread
const data = await load(url, OBJLoader, options);
// Decode on worker thread
const data = await load(url, OBJWorkerLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

