# OBJWriter

The `OBJWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data as Wavefront OBJ text.

| Writer         | Characteristic                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------- |
| File Format    | [OBJ](/docs/modules/obj)                                                                       |
| Data Format    | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension | `.obj`                                                                                         |
| File Type      | Text                                                                                           |
| Supported APIs | `encode`, `encodeSync`, `encodeTextSync`                                                       |

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {OBJWriter} from '@loaders.gl/obj';

declare const mesh: Mesh | MeshArrowTable;

const arrayBuffer = await encode(mesh, OBJWriter);
const text = OBJWriter.encodeTextSync(mesh);
```

## Data Format

`OBJWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before OBJ text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. Indexed meshes are written as OBJ faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options

`OBJWriter` does not currently define format-specific options.
