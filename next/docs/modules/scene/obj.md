Text mesh format

OBJ

# Move simple geometry into a shared mesh path.

The OBJ module reads Wavefront geometry and writes it back as text, exposing positions, normals, texture coordinates, and faces in the mesh shapes used by loaders.gl applications.

[OBJ format](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)

The mesh path

## Parse text. Reuse the geometry.

OBJ is intentionally straightforward: the module focuses on the geometry payload and returns a mesh representation that can feed rendering, conversion, or Arrow-based processing.

01

Read

Vertices, normals, texture coordinates, and faces

02

Shape

Mesh objects or Mesh Arrow tables

03

Write

Compatible mesh data back to OBJ text

04

Boundary

MTL material workflows remain a separate concern

The `@loaders.gl/scene/obj` module handles the [Wavefront OBJ format](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md), a simple ASCII format that defines 3D geometries as vertices, normals and faces.

Detailed guide

## OBJ module reference

The sections below cover installation, loader and writer entry points, and the source attribution for the parser.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/scene

npm install @loaders.gl/core
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader or Writer                                                                               | Description                                            |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`OBJLoader`](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md) | Loads OBJ meshes as Mesh objects or Mesh Arrow tables. |
| [`OBJWriter`](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md) | Writes Mesh or Mesh Arrow table data as OBJ text.      |

## Attribution[​](#attribution "Direct link to Attribution")

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
