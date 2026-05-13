import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

# OBJWriter

<ObjDocsTabs active="objwriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `OBJWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data as Wavefront OBJ text.

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
