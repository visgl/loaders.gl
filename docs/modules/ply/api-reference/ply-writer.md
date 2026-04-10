# PLYWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/-EXPERIMENTAL-orange.svg?style=flat-square" alt="EXPERIMENTAL" />
</p>

The `PLYWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data as ASCII Polygon File Format (PLY) text.

| Writer         | Characteristic                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------- |
| File Format    | [PLY](/docs/modules/ply/formats/ply)                                                           |
| Data Format    | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension | `.ply`                                                                                         |
| File Type      | Text                                                                                           |
| Supported APIs | `encode`, `encodeSync`, `encodeTextSync`                                                       |

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {PLYWriter} from '@loaders.gl/ply';

declare const mesh: Mesh | MeshArrowTable;

const arrayBuffer = await encode(mesh, PLYWriter);
const text = PLYWriter.encodeTextSync(mesh);
```

## Data Format

`PLYWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PLY text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. One-component custom attributes are written as scalar vertex properties. Indexed meshes are written as PLY faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options

`PLYWriter` does not currently define format-specific options.
