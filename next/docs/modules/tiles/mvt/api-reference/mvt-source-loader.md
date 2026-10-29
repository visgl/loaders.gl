MVT module · source API

# MVTSourceLoader

Resolve TileJSON or tile templates, then fetch individual Mapbox Vector Tiles as an application requests them.

[MVT format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[TileJSONLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/tilejson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/tilejson-loader.md)[MVT module](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)

What it does

## Keep the service metadata separate from tile requests.

MVTSourceLoader handles the source boundary: load the service description, resolve tile URLs, apply credentials, and return tiles as they are requested.

01

Source

TileJSON or a tiled service URL

02

Requests

Individual z / x / y vector tiles

03

Auth

Shared core credentials and Mapbox tokens

04

Errors

Empty tiles and text responses handled explicitly

Detailed guide

## MVTSourceLoader reference

The sections below document source creation, authentication, options, empty tiles, and service error behavior.

The `MVTSourceLoader` dynamically loads tiles, typically from big pre-tiled hierarchies on cloud storage.

| Source         | Characteristic                                                                            |
| -------------- | ----------------------------------------------------------------------------------------- |
| File Extension | `.mvt` `.tilejson`                                                                        |
| File Type      | Binary Archive                                                                            |
| File Format    | [Mapbox Vector Tiles](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md) |
| Data Format    | GeoArrow-compatible Arrow table                                                           |

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {MVTSourceLoader} from '@loaders.gl/tiles/mvt';



const source = createDataSource(url, [MVTSourceLoader]);

const tile = await source.getTile(...);
```

Vector tiles returned by `MVTSourceLoader` are Arrow tables by default, matching `MVTLoader`'s columnar path. Set `mvt.shape: 'geojson-table'` explicitly when object-row GeoJSON output is needed.

## Authentication[​](#authentication "Direct link to Authentication")

`core.credentials` applies to both the TileJSON request and every resolved tile URL. For Mapbox, use `createMapboxCredential` from `@loaders.gl/services`; explicit `access_token` values in a TileJSON URL or template take precedence. See the [authentication guide](https://loaders.gl/next/docs/developer-guide/authentication.md#mapbox-tiles).

## Options[​](#options "Direct link to Options")

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). The settings below are specific to this source.

| Option                    | Type      | Default         | Description                                                                                                                            |
| ------------------------- | --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mvt.ignoreTextResponses` | `boolean` | `false`         | If enabled, reports successful responses with text, JSON, or XML MIME types through `core.onError` and returns `null` for those tiles. |
| `mvt.shape`               | `string`  | `'arrow-table'` | Output shape for fetched vector tiles. Set `'geojson-table'` for object-row features.                                                  |

## Empty Tiles and Error Responses[​](#empty-tiles-and-error-responses "Direct link to Empty Tiles and Error Responses")

Tile services do not use one universal response for an empty or unavailable tile:

| Service                                                                                                     | Typical behavior                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [Mapbox Vector Tiles API](https://docs.mapbox.com/api/maps/vector-tiles/#vector-tiles-api-errors)           | Returns `404` for a missing tile and other non-2xx statuses for authentication, request, and rate-limit errors.                       |
| [ArcGIS Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile/) | Returns `404` when a tile is not found.                                                                                               |
| [TileServer GL](https://github.com/maptiler/tileserver-gl/blob/master/docs/config.rst#data-source-options)  | By default returns `204 No Content` for a missing vector tile; its `sparse` option changes this to `404`.                             |
| [Martin](https://github.com/maplibre/martin/blob/main/integration-tests/tests/geojson.rs)                   | Returns `204 No Content` for a tile without features.                                                                                 |
| [pg\_tileserv](https://github.com/CrunchyData/pg_tileserv/blob/master/main.go)                              | Returns `200` with the MVT MIME type and writes the encoded result; an empty result can therefore be a zero-byte binary response.     |
| [Tegola](https://github.com/go-spatial/tegola/blob/master/server/handle_map_layer_zxy.go)                   | Returns `200` with MVT bytes for a valid tile and `404` for requests outside the map bounds or without a layer at the requested zoom. |

`MVTSourceLoader` preserves these normal cases. A `204` or zero-byte successful response is returned as an empty `ArrayBuffer`, while a non-2xx response is reported through `core.onError` and returned as `null`.

Some proxies, authentication gateways, and custom tile services return an HTML, JSON, or XML error document with a successful HTTP status. Enable the defensive MIME-type check for those services:

```
const source = createDataSource(url, [MVTSourceLoader], {

  mvt: {

    ignoreTextResponses: true

  },

  core: {

    onError: error => console.error(error)

  }

});
```

When enabled, the source reports `text/*`, JSON, and XML responses through `core.onError` and returns `null`. It does not reject unrecognized vendor MIME types, because custom services may use them for valid binary tiles. The check is disabled by default to avoid changing behavior for services that use unusual MIME types.

## Source grid metadata[​](#source-grid-metadata "Direct link to Source grid metadata")

TileJSON establishes a canonical Web Mercator XYZ grid. `getMetadata().tileGrid` preserves its zoom identifiers and range; bounds describe dataset coverage and do not redefine the world grid or prove that individual tiles exist. Source requests use top-left XYZ rows, with `scheme: 'tms'` converted at the endpoint. The existing `{-y}` token always inverts the caller's XYZ row, so TMS metadata does not invert it twice.

`mvt.tileSize` defines a logical pixel frame (default 256 for TileJSON), independently of vector quantization extent or encoded image dimensions. `mvt.minZoom`, `mvt.maxZoom`, and `mvt.scheme` override advertised values. With `mvt.metadataUrl: null`, configure `mvt.coordinateReferenceSystem: 'EPSG:3857'` to establish a canonical source contract without a metadata fetch. Tile size alone does not establish a CRS. An arbitrary template or standalone MVT/MLT payload does not establish a geographic grid.

`tileMatrix` selects an exact native zoom ID; without it the shared native-ID-first/index-fallback rule applies. The resolved native zoom is also used for vector coordinate decoding. Out-of-world indices return `null`; unknown explicit IDs reject. See [Tile matrices](https://loaders.gl/next/docs/developer-guide/tile-matrices.md).

The geographic and row-convention contract follows [TileJSON 3.0](https://github.com/mapbox/tilejson-spec/tree/master/3.0.0).

A tile request's abort signal cancels its metadata wait promptly. Shared metadata discovery continues for other callers; cancelling one tile does not invalidate their requests.

TileJSON zoom ranges that are non-integral, inverted, or outside the supported grid range retain their native metadata and omit `tileGrid`. They do not prevent ordinary numeric tile requests.
