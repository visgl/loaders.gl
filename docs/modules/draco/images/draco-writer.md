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
