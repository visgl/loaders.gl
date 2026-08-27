import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';

# @loaders.gl/potree

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
point-cloud CRS support matrix and reprojection roadmap.

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
</p>

<PotreeDocsTabs active="overview" />

Support for loading and traversing [potree](http://potree.org/) format point clouds.

## Format Support

| Potree format version | Supported | Notes |
| --- | --- | --- |
| 1.0 - 1.3 | ❌ | Older metadata and node layouts are not supported by `PotreeSourceLoader`. |
| 1.4 | ✅ | Supports inline `cloud.js` hierarchy metadata and flat `octreeDir/r*.bin` node payloads. |
| 1.5 - 1.6 | ✅ | Supports Potree 1.x binary node payloads with `POSITION_CARTESIAN` attributes. |
| 1.7 | ✅ | Supports hierarchy chunk files and nested `octreeDir/r/r*.bin` node payloads. |
| 1.8 | ✅ | Supports hierarchy chunk files and `LAS`, `LAZ`, or Potree binary point payloads. |
| 2.x | ❌ | Potree 2.x metadata and octree layouts are not supported. |

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

Potree can also be used through the `DataSource` path with the lightweight point-cloud manager:

```ts
import {createDataSource} from '@loaders.gl/core';
import {PointCloudTileset} from '@loaders.gl/tiles';
import {PotreeSourceLoader} from '@loaders.gl/potree';

const dataSource = createDataSource(POTREE_URL, [PotreeSourceLoader], {
  core: {type: 'potree'},
  potree: {}
});

const tileset = new PointCloudTileset(dataSource);
await tileset.selectTiles(viewport);
```

## API

This modules provides the following exports:

- `PotreeHierarchyChunkLoader` for the hierarchy indices
- `PotreeSourceLoader` for point-cloud tile sources <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

## Roadmap

The plan is to provide the following loaders/writers:

- `PotreeLoader` for individual tiles

`PotreeLoader` is intended to work with the 3d tileset classes in the `@loaders.gl/3d-tiles` module.

- `Tileset3D` class will be generalized to accept loaded potree tilesets.

## Attribution

The `PotreeLoader` is a fork of Markus Schuetz' potree code (https://github.com/potree/potree) under BSD-2 clause license.
