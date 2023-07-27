# OBJLoader

The `OBJLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format.

| Loader                | Characteristic                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| File Extension        | `.obj`                                                                  |
| File Type             | Text                                                                    |
| File Format           | [Wavefront OBJ file](https://en.wikipedia.org/wiki/Wavefront_.obj_file) |
| Data Format           | [Mesh](/docs/specifications/category-mesh)                            |
| Decoder Type          | Synchronous                                                             |
| Worker Thread Support | Yes                                                                     |
| Streaming Support     | No                                                                      |

## Usage

```js
import {OBJLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const data = await load(url, OBJLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

Remarks:

- vertex colors are parsed as a `COLOR_0` attribute when red, green and blue values are included after x y and z (this precludes specifying w). The color values range from 0 to 1.

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.