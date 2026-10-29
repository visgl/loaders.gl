ArcGIS module · ArcGIS vector-tile source

![](/next/images/format-logos/arcgis-logo.jpg)Vector Tile

# ArcGIS VectorTileServer

Read your ArcGIS vector tile layer as raw MVT or decoded features, then apply the styling and labels your application needs.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-vector-tile-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-vector-tile-server.md)[ArcGIS service API](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)[MVT format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/arcgis-logo.jpg)Vector Tile[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-vector-tile-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-vector-tile-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Remote data, explicit steps

## Discover once. Request only what the application needs.

Service sources keep endpoint metadata, request construction, and decoded results separate. That makes a remote dataset behave like a predictable part of the data path.

01 · discover

### ArcGIS REST endpoint

A service directory exposes layers, operations, and formats.

FeatureServerImageServerSceneServer

pla&#x6E;**→**

02 · request

### Request the useful subset

Choose features, images, tiles, or scene content for this view.

wherebboxoutFieldssize

normaliz&#x65;**→**

[03 · application result](https://loaders.gl/next/docs/modules/arcgis.md)

### [VectorSource · ImageSource · Tileset3DSource](https://loaders.gl/next/docs/modules/arcgis.md)

[The application receives a source contract rather than a vendor-specific client.<!-- --> ↗](https://loaders.gl/next/docs/modules/arcgis.md)

The source owns protocol details; the application owns how returned features, pixels, tiles, or tables are used.

What it provides

## Keep tile bytes, decoded features, and style metadata connected.

The source exposes the raw PBF payload for low-level consumers and a decoded MVT path for map applications, while preserving ArcGIS’s published grid and style resources.

01

Metadata

Extent, CRS, LOD grid, and style URLs

02

Raw

Original vector-tile PBF bytes

03

Decoded

MVT features in application coordinates

04

Resources

Styles, sprites, and authentication

Detailed guide

## VectorTileServer reference

The sections below cover support, authentication, raw and decoded tiles, styles, and source options.

ArcGIS VectorTileServer endpoints publish Mapbox Vector Tile (MVT) data together with an ArcGIS tile grid, style document, and sprite resources. `ArcGISVectorTileServerSourceLoader` implements the loaders.gl `VectorTileSource` contract.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability             | Support                   | API and behavior                                                                                |
| ---------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| Service metadata       | ✅ Supported              | `getMetadata()` exposes extent, CRS, LOD grid, style URL, and sprite URL                        |
| Raw vector tiles       | ✅ Supported              | `getTile()` returns the original PBF bytes                                                      |
| Decoded vector tiles   | ✅ Supported              | `getVectorTile()` decodes MVT through `@loaders.gl/tiles/mvt`                                   |
| deck.gl tile data      | ✅ Supported              | `getTileData()` returns decoded WGS84 feature data                                              |
| Geometry coordinates   | ⚠️ WGS84                  | Decoded features are transformed from tile-local coordinates for visualization                  |
| Layer filtering        | ✅ Supported              | Forward MVT loader options to select named source layers                                        |
| Feature shape          | ✅ Configurable           | Standard MVT loader shape options are honored                                                   |
| ArcGIS style discovery | ✅ Supported              | Metadata includes the published root style and sprite resource URLs                             |
| Style application      | ⚠️ Application controlled | loaders.gl exposes style resources but does not translate the full ArcGIS style into deck props |
| Authentication         | ✅ Supported              | URL tokens and standard fetch options are preserved for all resources                           |
| deck.gl rendering      | ✅ First class            | `SourceLayer` consumes decoded vector tiles directly                                            |

## Authentication[​](#authentication "Direct link to Authentication")

`createArcGISCredential` applies an exact-origin token to metadata and tile requests made by this source. Explicit URL tokens take precedence. See the [authentication guide](https://loaders.gl/next/docs/developer-guide/authentication.md).

## Raw and decoded tiles[​](#raw-and-decoded-tiles "Direct link to Raw and decoded tiles")

```
import {load} from '@loaders.gl/core';

import {ArcGISVectorTileServerSourceLoader} from '@loaders.gl/arcgis';



const source = await load(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader]);



const metadata = await source.getMetadata();

const tileBytes = await source.getTile({z: 4, x: 6, y: 7});

const features = await source.getVectorTile({z: 4, x: 6, y: 7});
```

Use `getTile` when caching or forwarding the original PBF. Use `getVectorTile` when an application needs decoded geometries and properties.

## Decoder options[​](#decoder-options "Direct link to Decoder options")

MVT options are forwarded to `@loaders.gl/tiles/mvt`:

```
const source = await load(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader], {

  mvt: {

    shape: 'geojson-table',

    layers: ['roads', 'labels']

  }

});
```

## deck.gl integration[​](#deckgl-integration "Direct link to deck.gl integration")

```
import {SourceLayer} from '@loaders.gl/deck-layers';

import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';



const layer = new SourceLayer({

  id: 'arcgis-vector-tiles',

  data: vectorTileServiceUrl,

  loaders: ARCGIS_LOADERS,

  extent: [-180, -85.051129, 180, 85.051129],

  pickable: true

});
```

The ArcGIS style URL remains available in source metadata for applications that want to translate or selectively reuse the service's authored style.

## References[​](#references "Direct link to References")

* [ArcGIS REST API Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)

## TileMatrix metadata[​](#tilematrix-metadata "Direct link to TileMatrix metadata")

`getMetadata().tileGrid.matrices` preserves each advertised LOD identifier, resolution, origin, and rectangular tile size. Matrix dimensions are not inferred from service coverage, so ArcGIS grids remain partial and do not expose complete `tileMatrixSet` geometry. The grid retains CRS authority identifiers, preferring `latestWkid`; known Web Mercator aliases normalize to EPSG:3857.

After metadata loads, cached-tile URL methods select an exact `tileMatrix` identifier, otherwise the identifier equal to `z`, then the level at index `z`. Unknown identifiers fail. Before metadata is available, numeric `z` and explicit identifiers pass through. Use `tileMatrix` for noncontiguous service levels.

This metadata does not add projected rendering or reprojection. Dynamic MapServer export remains an XYZ Web Mercator operation. Vector geographic decoding requires a matching XYZ zoom; use raw `getTile()` for native matrix bytes when the requested identifier differs from `z`.

See [Tile matrices and tile matrix sets](https://loaders.gl/next/docs/developer-guide/tile-matrices.md).
