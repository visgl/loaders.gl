ArcGIS module · ArcGIS

![](/next/images/format-logos/arcgis-logo.jpg)API

# ArcGIS service sources

ArcGIS publishes several service families. loaders.gl maps the useful endpoint contracts onto sources for vectors, images, tiles, and scenes, with deterministic discovery and shared authentication.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Service sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[ArcGIS sources](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)

The ArcGIS boundary

## One service family, several data contracts.

Select the source contract that matches the endpoint: vector features, imagery, cached tiles, vector tiles, or 3D scene content.

01

Features

FeatureServer to vector and table data

02

Imagery

ImageServer to images or raster data

03

Tiles

MapServer and VectorTileServer sources

04

Scenes

SceneServer to I3S and point-cloud sources

Detailed guide

## ArcGIS service reference

The tables below map endpoint families to source contracts, discovery helpers, and provider-specific references.

ArcGIS Server directories can publish several endpoint families. loaders.gl v5 keeps one small source loader per visual data contract and a shared registry for automatic selection.

| Loader type                 | ArcGIS endpoint                                  | Source contract                                | Primary methods                                                                                                                                    | Output                                            |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `arcgis-feature-server`     | `FeatureServer`, queryable `MapServer/{layerId}` | `VectorSource`                                 | `getMetadata`, `getSchema`, `getFeatures`, `queryFeatures`, `queryFeaturePages`, `queryFeaturePage`, `queryCount`, `queryObjectIds`, `queryExtent` | GeoJSON, binary, Arrow; explicit query completion |
| `arcgis-image-server`       | `ImageServer`                                    | `ImageSource`                                  | `getMetadata`, `getImage`, `exportImage`, `exportRaster`                                                                                           | Image or LERC raster                              |
| `arcgis-image-server-tiles` | `ImageServer`                                    | `TileSource`                                   | `getMetadata`, `getTile`, `updateParameters`                                                                                                       | Image or LERC tile                                |
| `arcgis-map-server`         | `MapServer`                                      | `TileSource`                                   | `getMetadata`, `getTile`, `updateParameters`                                                                                                       | Cached or exported image tile                     |
| `arcgis-vector-tile-server` | `VectorTileServer`                               | `VectorTileSource`                             | `getMetadata`, `getTile`, `getVectorTile`                                                                                                          | PBF or decoded vector tile                        |
| `arcgis-scene-server`       | `SceneServer`                                    | `Tileset3DSource` or `PointCloudTilesetSource` | `getMetadata`, `getTilesetSource`                                                                                                                  | I3S mesh, Point, or Point Cloud source            |

`ARCGIS_LOADERS` contains these loaders in deterministic selection order. Pass it to async `load()` or deck.gl's `SourceLayer`:

```
import {load} from '@loaders.gl/core';

import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';



const source = await load(serviceUrl, ARCGIS_LOADERS);
```

When endpoint rewriting hides `FeatureServer`, `ImageServer`, `MapServer`, `VectorTileServer`, or `SceneServer` from the URL, specify the table's loader type through `core.type`.

## Runtime source classes[​](#runtime-source-classes "Direct link to Runtime source classes")

Import source classes and synchronous service loaders from `@loaders.gl/arcgis/bundled`. The package root exports lightweight loaders for async `load()` and source instance types.

| Source class                   | Source loader                        | Documentation                                                                                            |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `ArcGISVectorSource`           | `ArcGISFeatureServerSourceLoader`    | [FeatureServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)               |
| `ArcGISImageSource`            | `ArcGISImageServerSourceLoader`      | [ImageServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)                   |
| `ArcGISImageTileSource`        | `ArcGISImageTileSourceLoader`        | [ImageServer tiles](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md#image-tiles) |
| `ArcGISMapTileSource`          | `ArcGISMapTileSourceLoader`          | [MapServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)                       |
| `ArcGISVectorTileServerSource` | `ArcGISVectorTileServerSourceLoader` | [VectorTileServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)        |
| `ArcGISSceneServerSource`      | `ArcGISSceneServerSourceLoader`      | [SceneServer](https://loaders.gl/next/docs/modules/arcgis/arcgis-scene-server.md)                   |

## Discovery exports[​](#discovery-exports "Direct link to Discovery exports")

`getArcGISServices()` reads an ArcGIS REST services directory. `discoverArcGISCapabilities()` enriches discovered endpoints with normalized service capabilities, and `selectArcGISService()` returns the first entry matching an application requirement.

Provider-neutral metadata is intentionally smaller than each ArcGIS metadata document. Concrete sources retain access to provider-specific metadata and request controls where those details are needed.

## Excluded endpoint families[​](#excluded-endpoint-families "Direct link to Excluded endpoint families")

Geocoding, routing, geoprocessing, editing, administration, and portal content APIs are not part of the v5 service source foundation.

## ArcGIS references[​](#arcgis-references "Direct link to ArcGIS references")

* [Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
* [Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
* [Map Service](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
* [Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
