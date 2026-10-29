Point-cloud format

PCD

# Keep point attributes alongside positions.

The PCD module reads Point Cloud Data headers and point records, preserving named fields such as normals, color, intensity, and sensor-oriented metadata for downstream applications.

[PCD format](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

The point record

## Describe the fields before decoding the points.

PCD puts a compact schema in an ASCII header and lets the payload use ASCII, binary, or compressed binary storage. loaders.gl maps that description into reusable point-cloud data.

01

Header

Fields, sizes, types, counts, and organization

02

Payload

ASCII, binary, or binary-compressed records

03

Attributes

Coordinates, normals, color, intensity, and custom fields

04

Output

Point-cloud objects or Mesh Arrow tables

The `@loaders.gl/pointclouds/pcd` module handles the [Point Cloud Data](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md), which stores 3D point cloud data.

Detailed guide

## PCD module reference

The sections below cover installation, supported loader and writer entry points, and parser attribution.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/pointclouds

npm install @loaders.gl/core
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader or Writer                                                                                     | Description                                                        |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`PCDLoader`](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md) | Loads PCD point clouds as PointCloud objects or Mesh Arrow tables. |
| [`PCDWriter`](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md) | Writes Mesh or Mesh Arrow table point clouds as ASCII PCD text.    |

## Attribution[​](#attribution "Direct link to Attribution")

PCDLoader is a fork of the THREE.js PCDLoader under MIT License. The forked THREE.js source files contained the following attributions:

* @author Filipe Caixeta / <http://filipecaixeta.com.br>
* @author Mugen87 / <https://github.com/Mugen87>

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
