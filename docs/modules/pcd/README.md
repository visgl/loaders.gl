# Overview

The `@loaders.gl/pcd` module handles the the [Point Cloud Data](/docs/modules/pcd/formats/pcd), which stores 3D point cloud data).

## Installation

```bash
npm install @loaders.gl/pcd
npm install @loaders.gl/core
```

## Loaders

| Loader                                                        | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`PCDArrowLoader`](/docs/modules/pcd/api-reference/pcd-loader) | Loads PCD point clouds as [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`PCDLoader`](/docs/modules/pcd/api-reference/pcd-loader)      | Loads PCD point clouds as Mesh objects.      |

## Attribution

PCDLoader is a fork of the THREE.js PCDLoader under MIT License. The forked THREE.js source files contained the following attributions:

- @author Filipe Caixeta / http://filipecaixeta.com.br
- @author Mugen87 / https://github.com/Mugen87
