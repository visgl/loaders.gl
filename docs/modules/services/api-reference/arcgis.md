# ArcGIS service API reference

ArcGIS Server directories can publish several endpoint families. loaders.gl v5 keeps one small
source loader per visual data contract and a shared registry for automatic selection.

| Loader type | ArcGIS endpoint | Source contract | Primary methods | Output |
| --- | --- | --- | --- | --- |
| `arcgis-feature-server` | `FeatureServer` | `VectorSource` | `getMetadata`, `getSchema`, `getFeatures` | GeoJSON, binary, Arrow |
| `arcgis-image-server` | `ImageServer` | `ImageSource` | `getMetadata`, `getImage`, `exportImage`, `exportRaster` | Image or LERC raster |
| `arcgis-image-server-tiles` | `ImageServer` | `TileSource` | `getMetadata`, `getTile`, `updateParameters` | Image or LERC tile |
| `arcgis-map-server` | `MapServer` | `TileSource` | `getMetadata`, `getTile`, `updateParameters` | Cached or exported image tile |
| `arcgis-vector-tile-server` | `VectorTileServer` | `VectorTileSource` | `getMetadata`, `getTile`, `getVectorTile` | PBF or decoded vector tile |

`SERVICE_LOADERS` contains these loaders in deterministic selection order. Pass it to `load`,
`createDataSource`, or deck.gl's `SourceLayer`:

```ts
import {load} from '@loaders.gl/core';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const source = await load(serviceUrl, SERVICE_LOADERS);
```

When endpoint rewriting hides `FeatureServer`, `ImageServer`, `MapServer`, or `VectorTileServer`
from the URL, specify the table's loader type through `core.type`.

## Exported classes

| Source class | Source loader | Documentation |
| --- | --- | --- |
| `ArcGISVectorSource` | `ArcGISFeatureServerSourceLoader` | [FeatureServer](../arcgis-feature-server) |
| `ArcGISImageSource` | `ArcGISImageServerSourceLoader` | [ImageServer](../arcgis-image-server) |
| `ArcGISImageTileSource` | `ArcGISImageTileSourceLoader` | [ImageServer tiles](../arcgis-image-server#image-tiles) |
| `ArcGISMapTileSource` | `ArcGISMapTileSourceLoader` | [MapServer](../arcgis-map-server) |
| `ArcGISVectorTileServerSource` | `ArcGISVectorTileServerSourceLoader` | [VectorTileServer](../arcgis-vector-tile-server) |

## Discovery exports

`getArcGISServices()` reads an ArcGIS REST services directory.
`discoverArcGISCapabilities()` enriches discovered endpoints with normalized service capabilities,
and `selectArcGISService()` ranks them for an application requirement.

Provider-neutral metadata is intentionally smaller than each ArcGIS metadata document. Concrete
sources retain access to provider-specific metadata and request controls where those details are
needed.

## Excluded endpoint families

ArcGIS `SceneServer` is handled by the I3S loaders in `@loaders.gl/i3s`, not by this 2D service
module. Geocoding, routing, geoprocessing, editing, administration, and portal content APIs are not
part of the v5 service source foundation.

## ArcGIS references

- [Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
- [Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
- [Map Service](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
- [Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
