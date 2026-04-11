# OBJ Loaders

The `OBJArrowLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

`OBJLoader` parses the same OBJ format and returns the legacy [Mesh](/docs/specifications/category-mesh) object.

| Loader           | Output             | Use when                           |
| ---------------- | ------------------ | ---------------------------------- |
| `OBJLoader`      | `Mesh`             | You want the legacy mesh object.   |
| `OBJArrowLoader` | `Mesh Arrow table` | You want columnar mesh attributes. |

| Loader                | Characteristic                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| File Extension        | `.obj`                                                                  |
| File Type             | Text                                                                    |
| File Format           | [Wavefront OBJ file](https://en.wikipedia.org/wiki/Wavefront_.obj_file) |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| Decoder Type          | Synchronous                                                             |
| Worker Thread Support | Yes                                                                     |
| Streaming Support     | No                                                                      |

## Usage

```typescript
import {OBJArrowLoader, OBJLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const table = await load(url, OBJArrowLoader, options);
const data = await load(url, OBJLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

Remarks:

- vertex colors are parsed as a `COLOR_0` attribute when red, green and blue values are included after x y and z (this precludes specifying w). The color values range from 0 to 1.

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.
