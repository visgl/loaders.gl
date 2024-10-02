# MVTSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `MVTSource` dynamically loads tiles, typically from big pre-tiled hierarchies on cloud storage.

| Source         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.mvt` `.tilejson`                                   |
| File Type      | Binary Archive                                       |
| File Format    | [Mapbox Vector Tiles](/docs/modules/mvt/formats/mvt) |
| Data Format    | GeoJSON                                              |

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {MVTSource} from '@loaders.gl/pmtiles';

const source = createDataSource(url, [MVTSource]);
const tile = await source.getTile(...);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
