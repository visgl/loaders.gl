# Overview

The `@loaders.gl/ply` module handles the the [Polygon file format](/docs/modules/ply/formats/ply), a file format for 3D graphical objects described as a collection of polygons that is sometimes used to store point clouds.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/ply
```

## Loaders

| Loader                                                        | Description                       |
| ------------------------------------------------------------- | --------------------------------- |
| [`PLYArrowLoader`](/docs/modules/ply/api-reference/ply-loader) | Loads PLY meshes as [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`PLYLoader`](/docs/modules/ply/api-reference/ply-loader)      | Loads PLY meshes as Mesh objects.      |

## Attribution

PLYLoader is a fork of the THREE.js PLYLoader under MIT License. The THREE.js source files contained the following attributions:

@author Wei Meng / http://about.me/menway
