---
title: DracoWriter
description: Encode Mesh or Mesh Arrow data with Draco geometry compression.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Draco module · writer reference"
  title="Compress geometry at the writer boundary."
  description="DracoWriter accepts the mesh shapes produced by loaders.gl and encodes them with Draco. The same writer can serve mesh and point-cloud workflows while the format-specific options stay explicit."
  tone="pink"
  meta={['Mesh and point cloud', 'Draco compression', 'Worker-capable']}
  links={[
    {label: 'Draco module', to: '/docs/modules/draco'},
    {label: 'DracoLoader', to: '/docs/modules/draco/api-reference/draco-loader'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="Writer boundary"
  title="Give the writer a category-shaped mesh."
  description="The input can be a plain Mesh or Mesh Arrow table. Choose point-cloud mode for point data, or select an encoding method and speed trade-off for mesh geometry."
  tone="pink"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table data'},
    {label: 'Output', value: 'Draco-compressed .drc bytes'},
    {label: 'Point clouds', value: 'Point mode without triangle indices'},
    {label: 'Tuning', value: 'Encoding method, speed, and diagnostics'}
  ]}
/>

<ReferenceBoundary
  title="DracoWriter details"
  description="The reference below documents input shapes, supported output, usage, worker support, and encoding options."
  tone="pink"
/>

# DracoWriter

The `DracoWriter` encodes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data using [Draco3D](https://google.github.io/draco/) compression.

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.drc`                                     |
| File Type             | Binary                                     |
| Data Format           | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Format           | [Draco](https://google.github.io/draco/)   |
| Encoder Type          | Synchronous                                |
| Worker Thread Support | Yes                                        |
| Streaming Support     | No                                         |

## Usage

```typescript
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';

declare const mesh: Mesh | MeshArrowTable;

const data = await encode(mesh, DracoWriter, options);
```

## Options

| Option       | Type             | Default                     | Description                                                        |
| ------------ | ---------------- | --------------------------- | ------------------------------------------------------------------ |
| `pointcloud` | Boolean          | `false`                     | set to `true` to compress pointclouds (mode=`0` and no `indices`). |
| `method`     | String           | `MESH_EDGEBREAKER_ENCODING` | set Draco encoding method (applies to meshes only).                |
| `speed`      | [Number, Number] | set Draco speed options.    |
| `log`        | Function         | callback for debug info.    |
