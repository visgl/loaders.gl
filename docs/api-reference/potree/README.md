# @loaders.gl/potree

> The potree loaders are still under development and are not recommended for use

Support for loading and traversing [potree](http://potree.org/) point clouds.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/potree
```

## Roadmap

The plan is to provide the following loaders/writers:
- `PotreeLoader` for individual tiles
- `PotreeHierarchyChunkLoader` for the hierarchy indices

PotreeLoader will work with the 3d tileset classes in the `@loaders.gl/3d-tiles` module.
- `Tileset3D` class will be generalize to access the loaded potree tileset.

## Attribution

The `PotreeLoader` is a fork of Markus Schuetz' potree code (https://github.com/potree/potree) under BSD-2 clause license.
