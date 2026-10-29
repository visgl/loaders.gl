ArcGIS module · ArcGIS tile source

![](/next/images/format-logos/arcgis-logo.jpg)Map

# ArcGIS MapServer

Display your published ArcGIS map using its existing cache or dynamic map exports, with server-side rendering and your application’s credentials.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-map-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-map-server.md)[ArcGIS service API](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)[Tiles module](https://loaders.gl/next/docs/modules/tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/arcgis-logo.jpg)Map[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-map-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-map-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

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

## Use the same tile interface for two server modes.

MapServer can expose a cache, a dynamic export endpoint, or both. The source normalizes those modes while keeping the choice explicit and configurable.

01

Cached

Advertised tile matrix and tile URLs

02

Dynamic

Exported images for requested bounds

03

Grid

ArcGIS LODs normalized to tile metadata

04

Control

Mode, layers, format, time, and tokens

Detailed guide

## MapServer reference

The sections below cover support, authentication, cached tiles, dynamic exports, and source options.

ArcGIS MapServer services expose cached map tiles, dynamically rendered maps, or both. `ArcGISMapTileSourceLoader` presents either mode through one loaders.gl `TileSource`.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                   | Support         | API and behavior                                                                                                                                                              |
| ---------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cached tile services         | ✅ Supported    | Uses `/tile/{z}/{y}/{x}` when service metadata advertises `tileInfo`                                                                                                          |
| Dynamic map services         | ✅ Supported    | Uses `/export` with a Web Mercator tile bounding box                                                                                                                          |
| Automatic mode selection     | ✅ Supported    | `mode: 'auto'` chooses cached tiles when available, otherwise export                                                                                                          |
| Explicit mode selection      | ✅ Supported    | Use `mode: 'cached'` or `mode: 'dynamic'`                                                                                                                                     |
| Service metadata             | ✅ Supported    | `getMetadata()` exposes bounds, CRS, layers, tile size, and ArcGIS LODs                                                                                                       |
| ArcGIS LOD grid              | ✅ Supported    | Advertised levels, origins, resolutions, and tile sizes are normalized as partial per-level metadata                                                                          |
| Dynamic rendering parameters | ✅ Supported    | Layer visibility, format, transparency, time, and vendor parameters are forwarded                                                                                             |
| Multiple service URLs        | ✅ Supported    | Optional URL pool distributes tile requests deterministically                                                                                                                 |
| Authentication               | ✅ Supported    | URL tokens and standard fetch options are preserved                                                                                                                           |
| Feature queries              | Separate source | Use the [feature query source](https://loaders.gl/next/docs/developer-guide/arcgis/feature-layers.md) for queryable MapServer layers; the map tile source returns images |
| deck.gl rendering            | ✅ First class  | `SourceLayer` consumes the `TileSource` directly                                                                                                                              |

## Authentication[​](#authentication "Direct link to Authentication")

`createArcGISCredential` applies one exact-origin token to metadata, cached tiles, and dynamic exports, including requests issued through `SourceLayer`. Explicit URL tokens take precedence. See the [authentication guide](https://loaders.gl/next/docs/developer-guide/authentication.md).

## Cached tiles[​](#cached-tiles "Direct link to Cached tiles")

```
import {load} from '@loaders.gl/core';

import {ArcGISMapTileSourceLoader} from '@loaders.gl/arcgis';



const source = await load(

  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',

  [ArcGISMapTileSourceLoader]

);



const metadata = await source.getMetadata();

const image = await source.getTile({x: 2, y: 1, z: 2});
```

## Dynamic export tiles[​](#dynamic-export-tiles "Direct link to Dynamic export tiles")

Select export mode when a service is not cached or when dynamic layer, time, or rendering parameters are required:

```
const source = await load(mapServerUrl, [ArcGISMapTileSourceLoader], {

  'arcgis-map-server': {

    mode: 'dynamic',

    tileSize: 512,

    urls: ['https://tiles-a.example.com/MapServer', 'https://tiles-b.example.com/MapServer'],

    exportParameters: {

      layers: 'show:0,2',

      format: 'png32',

      transparent: true

    }

  }

});



source.updateParameters({time: '2024-01-01'});
```

Runtime parameters are merged into subsequent export requests, which makes time sliders and layer controls inexpensive to implement.

## deck.gl integration[​](#deckgl-integration "Direct link to deck.gl integration")

```
import {SourceLayer} from '@loaders.gl/deck-layers';

import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';



const layer = new SourceLayer({

  id: 'world-imagery',

  data: mapServerUrl,

  loaders: ARCGIS_LOADERS,

  extent: [-180, -85.051129, 180, 85.051129],

  minZoom: 0,

  maxZoom: 19

});
```

`SourceLayer` uses the normalized tile grid and requests only visible tiles.

## References[​](#references "Direct link to References")

* [ArcGIS REST API Map Service](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
* [ArcGIS REST API Export Map](https://developers.arcgis.com/rest/services-reference/enterprise/export-map/)

## Examples and source[​](#examples-and-source "Direct link to Examples and source")

[Open the map example](https://loaders.gl/next/examples/tiles/arcgis-map-server). The example selector includes cached tiles and dynamic exports; the latter is an image request, not feature querying.

[Runnable application source](https://github.com/visgl/loaders.gl/tree/master/examples/website/wms)

## Query vector features and tables[​](#query-vector-features-and-tables "Direct link to Query vector features and tables")

For a queryable `/MapServer/{layerId}`, use `ArcGISFeatureServerSourceLoader` and its [feature query API](https://loaders.gl/next/docs/developer-guide/arcgis/feature-layers.md). The registry selects this vector source for numbered MapServer layer URLs; MapServer root URLs retain the imagery source. Spatial layer queries require advertised GeoJSON support. Counts, IDs, extents and nonspatial tables share the feature-query implementation. This does not add `identify`, `find`, or legend APIs.

## TileMatrix metadata[​](#tilematrix-metadata "Direct link to TileMatrix metadata")

`getMetadata().tileGrid.matrices` preserves each advertised LOD identifier, resolution, origin, and rectangular tile size. Matrix dimensions are not inferred from service coverage, so ArcGIS grids remain partial and do not expose complete `tileMatrixSet` geometry. The grid retains CRS authority identifiers, preferring `latestWkid`; known Web Mercator aliases normalize to EPSG:3857.

After metadata loads, cached-tile URL methods select an exact `tileMatrix` identifier, otherwise the identifier equal to `z`, then the level at index `z`. Unknown identifiers fail. Before metadata is available, numeric `z` and explicit identifiers pass through. Use `tileMatrix` for noncontiguous service levels.

This metadata does not add projected rendering or reprojection. Dynamic MapServer export remains an XYZ Web Mercator operation. Vector geographic decoding requires a matching XYZ zoom; use raw `getTile()` for native matrix bytes when the requested identifier differs from `z`.

See [Tile matrices and tile matrix sets](https://loaders.gl/next/docs/developer-guide/tile-matrices.md).
