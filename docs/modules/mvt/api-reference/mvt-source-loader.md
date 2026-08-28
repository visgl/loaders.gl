# MVTSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `MVTSourceLoader` dynamically loads tiles, typically from big pre-tiled hierarchies on cloud storage.

| Source         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.mvt` `.tilejson`                                   |
| File Type      | Binary Archive                                       |
| File Format    | [Mapbox Vector Tiles](/docs/modules/mvt/formats/mvt) |
| Data Format    | GeoJSON                                              |

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {MVTSourceLoader} from '@loaders.gl/mvt';

const source = createDataSource(url, [MVTSourceLoader]);
const tile = await source.getTile(...);
```

## Authentication

`core.credentials` applies to both the TileJSON request and every resolved tile URL. For Mapbox,
use `createMapboxCredential` from `@loaders.gl/services`; explicit `access_token` values in a
TileJSON URL or template take precedence. See the
[authentication guide](/docs/developer-guide/authentication#mapbox-tiles).

## Options

| Option                    | Type      | Default | Description                                                                                                                          |
| ------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `mvt.ignoreTextResponses` | `boolean` | `false` | If enabled, reports successful responses with text, JSON, or XML MIME types through `core.onError` and returns `null` for those tiles. |

## Empty Tiles and Error Responses

Tile services do not use one universal response for an empty or unavailable tile:

| Service                                                                                                                   | Typical behavior                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [Mapbox Vector Tiles API](https://docs.mapbox.com/api/maps/vector-tiles/#vector-tiles-api-errors)                          | Returns `404` for a missing tile and other non-2xx statuses for authentication, request, and rate-limit errors.                           |
| [ArcGIS Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile/)               | Returns `404` when a tile is not found.                                                                                                   |
| [TileServer GL](https://github.com/maptiler/tileserver-gl/blob/master/docs/config.rst#data-source-options)                 | By default returns `204 No Content` for a missing vector tile; its `sparse` option changes this to `404`.                                 |
| [Martin](https://github.com/maplibre/martin/blob/main/integration-tests/tests/geojson.rs)                                  | Returns `204 No Content` for a tile without features.                                                                                     |
| [pg_tileserv](https://github.com/CrunchyData/pg_tileserv/blob/master/main.go)                                               | Returns `200` with the MVT MIME type and writes the encoded result; an empty result can therefore be a zero-byte binary response.         |
| [Tegola](https://github.com/go-spatial/tegola/blob/master/server/handle_map_layer_zxy.go)                                  | Returns `200` with MVT bytes for a valid tile and `404` for requests outside the map bounds or without a layer at the requested zoom.     |

`MVTSourceLoader` preserves these normal cases. A `204` or zero-byte successful response is returned as an empty `ArrayBuffer`, while a non-2xx response is reported through `core.onError` and returned as `null`.

Some proxies, authentication gateways, and custom tile services return an HTML, JSON, or XML error document with a successful HTTP status. Enable the defensive MIME-type check for those services:

```typescript
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
