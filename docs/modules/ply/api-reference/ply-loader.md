# PLY Loaders

The `PLYArrowLoader` parses simple meshes in the Polygon File Format or the Stanford Triangle Format and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

`PLYLoader` parses the same PLY format and returns the legacy [Mesh](/docs/specifications/category-mesh) object.

| Loader           | Output             | Use when                           |
| ---------------- | ------------------ | ---------------------------------- |
| `PLYLoader`      | `Mesh`             | You want the legacy mesh object.   |
| `PLYArrowLoader` | `Mesh Arrow table` | You want columnar mesh attributes. |

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Format           | [PLY](/docs/modules/ply/formats/ply)       |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension        | `.ply`                                     |
| File Type             | Binary/Text                                |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | Yes                                        |
| Streaming Support     | No                                         |

## Usage

```typescript
import {PLYArrowLoader, PLYLoader} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const table = await load(url, PLYArrowLoader, options);
const data = await load(url, PLYLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
