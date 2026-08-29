---
title: QuantizedMeshLoader
description: Decode Cesium quantized mesh terrain tiles into mesh data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Terrain module · loader API"
  title="QuantizedMeshLoader"
  description="Decode Cesium quantized mesh terrain tiles into a mesh or Mesh Arrow table, preserving the compact terrain representation until it crosses into application data."
  tone="orange"
  meta={['From v2.2', 'Quantized Mesh', 'Mesh / Arrow output']}
  links={[
    {label: 'Terrain module', to: '/docs/modules/terrain'},
    {label: 'Terrain module', to: '/docs/modules/terrain'},
    {label: 'QuantizedMeshWriter', to: '/docs/modules/terrain/api-reference/quantized-mesh-writer'}
  ]}
/>

<DocOrientation
  eyebrow="What it reconstructs"
  title="Decode a terrain tile that already knows its mesh shape."
  description="Quantized Mesh stores terrain vertices and indices in a compact binary form. The loader expands that tile into the common mesh family used by rendering and analysis code."
  tone="orange"
  items={[
    {label: 'Input', value: 'A `.terrain` quantized mesh tile'},
    {label: 'Output', value: 'Mesh or Mesh Arrow table'},
    {label: 'Coordinates', value: 'Bounds mapped to tile positions'},
    {label: 'Optional', value: 'Skirts and future terrain extensions'}
  ]}
/>

<ReferenceBoundary
  title="QuantizedMeshLoader reference"
  description="The sections below document format metadata, usage, output shapes, options, and current limitations."
  tone="orange"
/>

`QuantizedMeshLoader` reconstructs mesh surfaces from the [quantized
mesh][quantized_mesh] format. It returns the legacy [Mesh](/docs/specifications/category-mesh) object by default and can return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with `quantized-mesh.shape: 'arrow-table'`.

[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `mesh`        | `Mesh`             | You want the legacy mesh object.   |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.terrain`                                 |
| File Type             | Binary                                     |
| File Format           | Encoded mesh                               |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| Supported APIs        | `load`, `parse`, `parseSync`               |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | Yes                                        |
| Streaming Support     | No                                         |

## Usage

```typescript
import {QuantizedMeshLoader} from '@loaders.gl/terrain';
import {load} from '@loaders.gl/core';

const options = {
  'quantized-mesh': {
    bounds: [0, 0, 1, 1]
  }
};
const data = await load(url, QuantizedMeshLoader, options);
const table = await load(url, QuantizedMeshLoader, {
  worker: false,
  'quantized-mesh': {...options['quantized-mesh'], shape: 'arrow-table'}
});
```

## Options

| Option                       | Type            | Default        | Description                                                                     |
| ---------------------------- | --------------- | -------------- | ------------------------------------------------------------------------------- |
| `quantized-mesh.bounds`      | `array<number>` | `[0, 0, 1, 1]` | Bounds of the image to fit x,y coordinates into. In `[minX, minY, maxX, maxY]`. |
| `quantized-mesh.shape`       | `string`        | `mesh`         | Output shape: `'mesh'` or `'arrow-table'`.                                      |
| `quantized-mesh.skirtHeight` | `number`        | `null`         | If set, create the skirt for the tile with particular height in meters          |

## Remarks

### Future Work

- Skirting. The Quantized Mesh format includes data on which vertices are on each edge, which should assist in creating a skirt.
- Use optional Quantized Mesh extensions, such as vertex normals.
- Closer integration into tile culling. Quantized Mesh headers, the first 88 bytes, describe a tile's bounding volume and min/max elevations. Just the headers could be parsed while deciding whether the tile is in view. Upon verifying visibility, the rest of the tile's data can be parsed.
