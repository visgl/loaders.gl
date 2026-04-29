# Overview

The `@loaders.gl/obj` module handles the the [Wavefront OBJ format](/docs/modules/obj/formats/obj), a simple ASCII format that defines 3D geometries as vertices, normals and faces.

## Installation

```bash
npm install @loaders.gl/obj
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader or Writer                                               | Description                         |
| -------------------------------------------------------------- | ----------------------------------- |
| [`OBJLoader`](/docs/modules/obj/api-reference/obj-loader)      | Loads OBJ meshes as Mesh objects or Mesh Arrow tables. |
| [`OBJWriter`](/docs/modules/obj/api-reference/obj-writer)      | Writes Mesh or Mesh Arrow table data as OBJ text. |

## Attribution

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.
