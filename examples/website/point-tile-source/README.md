# point-tile-source-website-example

Explore Potree and COPC point cloud sources with PointCloudTileset.

Supported formats: Potree, COPC, LAS, LAZ.

This is a standalone website example for the source-backed point-cloud tileset flow.

It demonstrates:

- `PointCloudTileset` from `@loaders.gl/tiles`
- `PotreeSourceLoader` from `@loaders.gl/tiles-3d/potree`
- `COPCSourceLoader` from `@loaders.gl/tiles-3d/copc`
- a small deck.gl layer that renders normalized point-tile content

### Usage

```bash
yarn
yarn start
```

### Datasets

- Potree sample hosted from `deck.gl-data`
- COPC sample hosted from this repository
