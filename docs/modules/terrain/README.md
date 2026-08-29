---
title: Terrain module
description: Reconstruct terrain meshes from height maps and quantized mesh tiles.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Terrain surfaces"
  title="Turn elevation samples into a renderable surface."
  description="The terrain module decodes height-map imagery and quantized mesh tiles into mesh data that can be rendered, analyzed, or carried as a mesh Arrow table."
  tone="orange"
  meta={['Height maps', 'Quantized mesh', 'Mesh output']}
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'Quantized mesh loader', to: '/docs/modules/terrain/api-reference/quantized-mesh-loader'}
  ]}
/>

<DocOrientation
  eyebrow="Two terrain inputs"
  title="Decode samples, then let the application place the mesh."
  description="Height maps provide elevation samples for reconstruction. Quantized mesh provides an already tessellated terrain tile. Both can end in the same mesh-oriented application path."
  tone="orange"
  items={[
    {label: 'Height map', value: 'RGB-encoded elevation samples'},
    {label: 'Quantized mesh', value: 'Compressed terrain vertices and indices'},
    {label: 'Output', value: 'Mesh or mesh Arrow table'},
    {label: 'Writer', value: 'Encode compatible terrain as quantized mesh'}
  ]}
/>

The `@loaders.gl/terrain` module reconstructs mesh surfaces from either height
map images--e.g. [Mapzen Terrain Tiles][mapzen_terrain_tiles]--which encode
elevation into R,G,B values or the [quantized mesh][quantized_mesh] format.

[mapzen_terrain_tiles]: https://github.com/tilezen/joerd/blob/master/docs/formats.md
[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

<ReferenceBoundary
  title="Terrain loaders and writers"
  description="The sections below cover installation, supported loader and writer entry points, and the third-party components used for mesh reconstruction."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/terrain
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader or Writer                                                                | Description                                         |
| ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `TerrainLoader`                                                                 | Loads height-map terrain as a Mesh or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| `QuantizedMeshLoader`                                                           | Loads quantized mesh terrain as a Mesh or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`QuantizedMeshWriter`](/docs/modules/terrain/api-reference/quantized-mesh-writer) | Writes triangle-list Mesh or Mesh Arrow table terrain data as quantized mesh. |

## Attribution

The `QuantizedMeshLoader` is a fork of
[`quantized-mesh-decoder`](https://github.com/heremaps/quantized-mesh-decoder)
from HERE under the MIT license to decode quantized mesh.

The `TerrainLoader` uses [MARTINI](https://github.com/mapbox/martini) or [Delatin](https://github.com/mapbox/delatin) for mesh
reconstruction which are both under the ISC License.
