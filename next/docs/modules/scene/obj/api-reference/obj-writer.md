OBJ writer

OBJ

# Write common mesh data into a format every 3D tool knows.

`OBJWriter` accepts legacy Mesh objects and Mesh Arrow tables, then emits Wavefront OBJ text with the standard vertex attributes and faces that downstream tools expect.

[OBJ module](https://loaders.gl/next/docs/modules/scene/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj.md)[OBJ format](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

The OBJ writing path

## Start with common mesh data. Emit portable geometry text.

The writer normalizes the legacy and Arrow-backed mesh inputs at the boundary, then writes positions, optional attributes, and indexed or sequential triangle faces.

01

Input

Mesh or Mesh Arrow table

02

Attributes

Position, normal, UV, color, and custom scalars

03

Topology

Indexed or sequential triangle faces

04

Output

Wavefront OBJ text or encoded bytes

OBJ[Try It](https://loaders.gl/next/examples/pointclouds/obj)[Overview](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[Format](https://loaders.gl/next/docs/modules/scene/obj/format.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[OBJWriter](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

Detailed guide

## OBJ output details

The reference below covers accepted mesh shapes, written attributes, face output, and encoding entry points.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `OBJWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) data as Wavefront OBJ text.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';

import {OBJWriter} from '@loaders.gl/scene/obj';



declare const mesh: Mesh | MeshArrowTable;



const arrayBuffer = await encode(mesh, OBJWriter);

const text = OBJWriter.encodeTextSync(mesh);
```

## Data Format[​](#data-format "Direct link to Data Format")

`OBJWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before OBJ text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. Indexed meshes are written as OBJ faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options[​](#options "Direct link to Options")

`OBJWriter` does not currently define format-specific options.
