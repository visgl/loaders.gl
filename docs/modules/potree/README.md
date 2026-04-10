# @loaders.gl/potree

> The potree loaders are still under development and are not yet considered ready for use.

Support for loading and traversing [potree](http://potree.org/) format point clouds.

## Installation

```bash
npm install @loaders.gl/potree
npm install @loaders.gl/core
```

## Usage

> Intended usage only, not yet working!

```
import {load} from `@loaders.gl/core`;
import {PotreeLoader} from `@loaders.gl/potree`;
import {Tileset3D} from `@loaders.gl/category-3d-tiles`;

const potree = await load(POTREE_URL);
const tileset = new Tileset3D(potree);
const tilesToRender = tileset.traverse(frameData);
```

## API

This modules provides the following exports:

- `PotreeHierarchyChunkLoader` for the hierarchy indices

## Roadmap

The plan is to provide the following loaders/writers:

- `PotreeLoader` for individual tiles

`PotreeLoader` is intended to work with the 3d tileset classes in the `@loaders.gl/3d-tiles` module.

- `Tileset3D` class will be generalized to accept loaded potree tilesets.

## Attribution

The `PotreeLoader` is a fork of Markus Schuetz' potree code (https://github.com/potree/potree) under BSD-2 clause license.
