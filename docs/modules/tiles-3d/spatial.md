# @loaders.gl/tiles-3d/spatial

Describe tileset coordinate frames, transform spatial data, and register geoid and CRS resources.

```
import {createBoundingVolume, calculateTransformProps, convertS2BoundingVolumeToOBB, applyTilesetSpatialOptions} from '@loaders.gl/tiles-3d/spatial';
```

## API[​](#api "Direct link to API")

| Export                                   | Kind    |
| ---------------------------------------- | ------- |
| `createBoundingVolume`                   | Utility |
| `calculateTransformProps`                | Utility |
| `convertS2BoundingVolumeToOBB`           | Utility |
| `S2VolumeInfo`                           | Type    |
| `CreateTilesetSpatialReferenceOptions`   | Type    |
| `TilesetCoordinateFrame`                 | Type    |
| `TilesetElevationBounds`                 | Type    |
| `TilesetElevationMode`                   | Type    |
| `TilesetElevationProvider`               | Type    |
| `TilesetElevationRange`                  | Type    |
| `TilesetElevationSample`                 | Type    |
| `TilesetHeightReference`                 | Type    |
| `TilesetOutputCoordinates`               | Type    |
| `TilesetSpatialOptions`                  | Type    |
| `TilesetSpatialReference`                | Type    |
| `TilesetSpatialReferenceProvenance`      | Type    |
| `TilesetTargetHeightReference`           | Type    |
| `applyTilesetSpatialOptions`             | Utility |
| `createTilesetSpatialReference`          | Utility |
| `markTilesetSpatialReferenceTransformed` | Utility |
| `get3DTilesSpatialReference`             | Utility |
| `getI3SSpatialReference`                 | Utility |
| `SpatialCoordinateTransformer`           | Utility |
| `getSpatialCoordinateFrame`              | Utility |
| `Tiles3DSpatialTransformer`              | Utility |
| `Tiles3DSpatialBoundingVolume`           | Type    |
| `I3SSpatialBounds`                       | Type    |
| `I3SSpatialObb`                          | Type    |
| `I3SSpatialTransformer`                  | Utility |
| `getGeoidModel`                          | Utility |
| `registerGeoidModel`                     | Utility |
| `registerGeoidModelFromPgm`              | Utility |
| `registerSpatialCrs`                     | Utility |
| `registerSpatialDatumGrid`               | Utility |
| `I3STransformedPositions`                | Type    |
| `I3STransformedGeometry`                 | Type    |

See the [tiles-3d module](https://loaders.gl/docs/modules/tiles-3d.md) for installation and related entrypoints.
