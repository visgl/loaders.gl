Polygon and vertex format

PLY

# Describe a mesh as elements and properties.

The PLY module reads flexible vertex and face elements in ASCII or binary form, preserving common properties such as colors, normals, texture coordinates, and confidence values.

[PLY format](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)[PLYLoader](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)

The element model

## Read the header, then read the elements it describes.

PLY headers declare element counts and properties before the payload. This makes the format flexible enough for meshes and useful for point-cloud-style vertex data.

01

Header

Format, elements, property types, and counts

02

Vertices

Positions plus optional normals, color, or UVs

03

Faces

Variable-length index lists and face properties

04

Output

Mesh objects or Mesh Arrow tables

The `@loaders.gl/pointclouds/ply` module handles the [Polygon file format](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md), a file format for 3D graphical objects described as a collection of polygons that is sometimes used to store point clouds.

Detailed guide

## PLY module reference

The sections below cover installation, loader and writer entry points, and the parser attribution.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/pointclouds
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader or Writer                                                                                     | Description                                             |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`PLYLoader`](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md) | Loads PLY meshes as Mesh objects or Mesh Arrow tables.  |
| [`PLYWriter`](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer.md) | Writes Mesh or Mesh Arrow table data as ASCII PLY text. |

## Attribution[​](#attribution "Direct link to Attribution")

PLYLoader is a fork of the THREE.js PLYLoader under MIT License. The THREE.js source files contained the following attributions:

@author Wei Meng / <http://about.me/menway>

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
