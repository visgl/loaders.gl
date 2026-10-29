Text mesh format

OBJ

# A simple text description of 3D geometry.

Wavefront OBJ keeps mesh interchange readable: vertices, normals, texture coordinates, and face indices are written as line-oriented records that tools can inspect and share.

[OBJ module](https://loaders.gl/next/docs/modules/scene/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)

OBJ[Try It](https://loaders.gl/next/examples/pointclouds/obj)[Overview](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[Format](https://loaders.gl/next/docs/modules/scene/obj/format.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[OBJWriter](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

The record vocabulary

## Declare points, then connect them into faces.

OBJ separates geometry declarations from face references. The parser can therefore build a mesh while leaving material and scene-graph concerns to higher-level formats.

01

Positions

\`v\` records define vertex coordinates

02

Surface data

\`vn\` normals and \`vt\` texture coordinates

03

Topology

\`f\` records reference the declared vertices

04

Companion

MTL files may describe materials separately

* *[`@loaders.gl/scene/obj`](https://loaders.gl/next/docs/modules/scene/obj.md)*
* *[Wavefront OBJ on Wikipedia](https://en.wikipedia.org/wiki/Wavefront_.obj_file)*

OBJ is a text format for exchanging 3D geometry. It stores vertex positions, texture coordinates, normals, and polygon faces, and is commonly paired with MTL files for material definitions.

Detailed guide

## OBJ syntax and variants

The sections below cover the line-oriented records, MTL companion files, and the scope of the loaders.gl geometry parser.

## Syntax[​](#syntax "Direct link to Syntax")

OBJ files are line-oriented text files. Common records include `v` for vertex positions, `vt` for texture coordinates, `vn` for vertex normals, and `f` for faces. Face records reference previously declared vertices, texture coordinates, and normals by index.

## Variants[​](#variants "Direct link to Variants")

The base OBJ format is often used with a companion MTL material file. loaders.gl's OBJ support focuses on geometry; material workflows are handled separately by higher level scene graph formats.

## History[​](#history "Direct link to History")

The OBJ format was developed by Wavefront Technologies for Advanced Visualizer and remains widely used because it is simple, text-based, and supported by many 3D tools.
