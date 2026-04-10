# MVTWriter

:::caution
Experimental
:::

Writer for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.mvt`,                                                                   |
| File Type      | Binary                                                                    |
| File Format    | [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                             |
| Supported APIs | `encode`, `encodeSync`                                                    |

## Installation

```bash
npm install @loaders.gl/mvt
npm install @loaders.gl/core
```

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/mvt';

const arrayBuffer = await encode(geojson, MVTWriter, {
  mvt: {
    layerName: 'my-layer',
    version: 2,
    extent: 4096
  }
});
```

## Options

| Option        | Type                                | Default          | Description                                                          |
| ------------- | ----------------------------------- | ---------------- | -------------------------------------------------------------------- |
| mvt.layerName | `string`                            | `'geojsonLayer'` | Name of the single layer that will be written into the tile          |
| mvt.version   | `number`                            | `1`              | Vector tile specification version                                    |
| mvt.extent    | `number`                            | `4096`           | Extent of the vector tile grid                                       |
| mvt.tileIndex | `{x: number, y: number, z: number}` | `undefined`      | Optional tile index for projecting WGS84 coordinates into tile space |
