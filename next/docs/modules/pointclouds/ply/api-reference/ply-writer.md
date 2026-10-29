PLY writer

PLY

# Write common mesh data into a portable text format.

`PLYWriter` accepts legacy Mesh objects and Mesh Arrow tables, normalizes their common attributes, and writes ASCII Polygon File Format output for tools and pipelines that speak PLY.

[PLY module](https://loaders.gl/next/docs/modules/pointclouds/ply.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply.md)[PLY format](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

The PLY writing path

## Normalize the mesh. Emit a file other tools can read.

The writer keeps format delivery separate from the application’s mesh representation, carrying standard vertex attributes and faces into a simple PLY schema.

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

ASCII PLY text or encoded bytes

PLY[Try It](https://loaders.gl/next/examples/pointclouds/ply)[Overview](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/ply/format.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)[PLYWriter](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/ply/benchmarks.md)

Detailed guide

## PLY output details

The reference below covers accepted mesh shapes, written attributes, faces, and encoding entry points.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `PLYWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) data as ASCII Polygon File Format (PLY) text.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';

import {PLYWriter} from '@loaders.gl/pointclouds/ply';



declare const mesh: Mesh | MeshArrowTable;



const arrayBuffer = await encode(mesh, PLYWriter);

const text = PLYWriter.encodeTextSync(mesh);
```

## Data Format[​](#data-format "Direct link to Data Format")

`PLYWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PLY text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL`, `TEXCOORD_0`, and `COLOR_0` attributes when present. One-component custom attributes are written as scalar vertex properties. Indexed meshes are written as PLY faces; non-indexed triangle-list meshes are written as sequential triangle faces.

## Options[​](#options "Direct link to Options")

`PLYWriter` does not currently define format-specific options.
