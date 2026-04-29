# MLTSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

The `MLTSourceLoader` dynamically loads MapLibre Tile (`.mlt`) data from URL based tile services.

| Source         | Characteristic                                 |
| -------------- | ---------------------------------------------- |
| File Extension | `.mlt`                                         |
| File Type      | Binary Archive                                 |
| File Format    | [MapLibre Tile](/docs/modules/mlt/formats/mlt) |
| Data Format    | GeoJSON                                        |

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {MLTSourceLoader} from '@loaders.gl/mlt';

const source = createDataSource('https://example.com/tiles', [MLTSourceLoader]);
const features = await source.getTile({x: 0, y: 0, z: 0});
```

## Options

| Option            | Type                                      | Default           | Description                                                        |
| ----------------- | ----------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `mlt.extension`   | `string`                                  | `.mlt`            | Tile URL extension.                                                |
| `mlt.metadataUrl` | `string \| null`                          | `null`            | Optional metadata URL override (`tile.json` by default is not assumed). |
| `mlt.coordinates` | `'wgs84' \| 'local'`                      | `wgs84`           | Coordinates output from parsed tiles.                              |
| `mlt.shape`       | `'geojson-table' \| 'binary-geometry'`    | `geojson-table`   | Returned geometry shape.                                           |
| `mlt.layers`      | `string[]`                                | `N/A`             | Optional layer filter before decoding geometry.                    |

## Additional references

- [MLTLoader](/docs/modules/mlt/api-reference/mlt-loader)
- [MLT format](/docs/modules/mlt/formats/mlt)

## Attribution

`MLTSourceLoader` fetches URL-addressed MLT tiles and parses them via [`MLTLoader`](/docs/modules/mlt/api-reference/mlt-loader), which uses the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder implementation.
