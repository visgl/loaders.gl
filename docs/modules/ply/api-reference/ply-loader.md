import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

# PLYLoader

<PlyDocsTabs active="plyloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

`PLYLoader` parses simple meshes in the Polygon File Format or the Stanford Triangle Format and returns a legacy [Mesh](/docs/specifications/category-mesh) object by default.

Set `ply.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

## Usage

```typescript
import {PLYLoader} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PLYLoader, options);
const table = await load(url, PLYLoader, {ply: {shape: 'arrow-table'}});
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `ply.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects Mesh or Mesh Arrow table output. |
