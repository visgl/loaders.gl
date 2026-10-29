Draco module · writer reference

![](/next/images/format-logos/draco-logo.svg)

# Compress geometry at the writer boundary.

DracoWriter accepts the mesh shapes produced by loaders.gl and encodes them with Draco. The same writer can serve mesh and point-cloud workflows while the format-specific options stay explicit.

[Draco module](https://loaders.gl/next/docs/modules/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

Writer boundary

## Give the writer a category-shaped mesh.

The input can be a plain Mesh or Mesh Arrow table. Choose point-cloud mode for point data, or select an encoding method and speed trade-off for mesh geometry.

01

Input

Mesh or Mesh Arrow table data

02

Output

Draco-compressed .drc bytes

03

Point clouds

Point mode without triangle indices

04

Tuning

Encoding method, speed, and diagnostics

Detailed guide

## DracoWriter details

The reference below documents input shapes, supported output, usage, worker support, and encoding options.

# DracoWriter

The `DracoWriter` encodes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) data using [Draco3D](https://google.github.io/draco/) compression.

| DracoWriter       |                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Extension    | `.drc`                                                                                                                                                                             |
| File Type         | Binary                                                                                                                                                                             |
| Data Format       | [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables), [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) |
| File Format       | [Draco](https://google.github.io/draco/)                                                                                                                                           |
| Encoder Type      | Synchronous                                                                                                                                                                        |
| Worker Thread     | ✅ Yes                                                                                                                                                                             |
| Streaming Support | ❌ No                                                                                                                                                                              |

## Usage[​](#usage "Direct link to Usage")

```
import {DracoWriter} from '@loaders.gl/draco';

import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';



declare const mesh: Mesh | MeshArrowTable;



const data = await encode(mesh, DracoWriter, options);
```

## Options[​](#options "Direct link to Options")

See the maintained [DracoWriter reference](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md) for current namespaced options and encoding limits. This page's former flat-option table is obsolete.
