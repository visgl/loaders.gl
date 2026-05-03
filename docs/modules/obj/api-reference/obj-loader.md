import {ObjDocsTabs} from '@site/src/components/docs/obj-docs-tabs';

# OBJLoader

<ObjDocsTabs active="objloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

`OBJLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format and returns a legacy [Mesh](/docs/specifications/category-mesh) object by default.

Set `obj.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

## Usage

```typescript
import {OBJLoader} from '@loaders.gl/obj';
import {load} from '@loaders.gl/core';

const data = await load(url, OBJLoader, options);
const table = await load(url, OBJLoader, {obj: {shape: 'arrow-table'}});
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `obj.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects Mesh or Mesh Arrow table output. |

Remarks:

- vertex colors are parsed as a `COLOR_0` attribute when red, green and blue values are included after x y and z (this precludes specifying w). The color values range from 0 to 1.

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.
