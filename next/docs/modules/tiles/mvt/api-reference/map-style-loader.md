MVT module · style API

# MapStyleLoader

Parse a MapLibre or Mapbox style document and resolve its tile-source metadata into a form that applications can inspect or pass into tile workflows.

[Map style format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md)[MVT source](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)[MVT module](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)

What it resolves

## Turn a style document into usable source metadata.

MapStyleLoader preserves the style while resolving relative URLs and referenced TileJSON documents, so applications can derive tile endpoints without reimplementing URL handling.

01

Input

MapLibre or Mapbox style JSON

02

Sources

Resolved URLs and TileJSON fields

03

Layers

Preserved style layers and unknown fields

04

Boundary

Metadata resolution, not rendering

Detailed guide

## MapStyleLoader reference

The sections below document loading, URL resolution, direct resolution, and the fields handled by the loader.

The `MapStyleLoader` parses MapLibre / Mapbox style JSON and returns a normalized style object with resolved tile-source metadata.

It is designed for applications that need to inspect style documents, derive tile endpoints, or bridge style metadata into other runtimes such as deck.gl tile workflows.

| MapStyleLoader    |                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------- |
| File Extension    | `.json`                                                                                |
| File Type         | Text                                                                                   |
| File Format       | [Map Styles](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md) |
| Data Format       | `ResolvedMapStyle`                                                                     |
| Decoder Type      | Asynchronous                                                                           |
| Worker Thread     | ❌ No                                                                                  |
| Streaming Support | ❌ No                                                                                  |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {MapStyleLoader} from '@loaders.gl/tiles/mvt';



const style = await load('https://example.com/styles/base/style.json', MapStyleLoader);
```

With explicit URL resolution options:

```
import {parse} from '@loaders.gl/core';

import {MapStyleLoader} from '@loaders.gl/tiles/mvt';



const style = await parse(styleJsonText, MapStyleLoader, {

  mapStyle: {

    baseUrl: 'https://example.com/styles/base/style.json',

    fetch: customFetch,

    fetchOptions: {headers: {'x-token': token}}

  }

});
```

Direct style resolution without the loader:

```
import {resolveMapStyle} from '@loaders.gl/tiles/mvt';



const style = await resolveMapStyle('https://example.com/styles/base/style.json');
```

## What the loader resolves[​](#what-the-loader-resolves "Direct link to What the loader resolves")

`MapStyleLoader`:

* parses the style JSON
* preserves unknown fields on the style, sources, and layers
* resolves relative `sources.*.url` values
* fetches TileJSON documents referenced from `sources.*.url`
* merges fetched TileJSON fields into the source
* resolves `sources.*.tiles[]` entries relative to the correct base URL
* guarantees that `sources` and `layers` are present in the returned object

It does not fetch or expand other style sub resources such as:

* `sprite`
* `glyphs`
* external images referenced by renderer-specific metadata

Those fields remain untouched in the returned metadata.

## Returned Data Format[​](#returned-data-format "Direct link to Returned Data Format")

The loader returns a `ResolvedMapStyle` object.

```
type ResolvedMapStyle = MapStyle & {

  sources: Record<string, MapStyleSource>;

  layers: MapStyleLayer[];

};
```

### `MapStyle`[​](#mapstyle "Direct link to mapstyle")

```
type MapStyle = {

  version?: number;

  metadata?: Record<string, unknown>;

  sources?: Record<string, MapStyleSource>;

  layers?: MapStyleLayer[];

  [key: string]: unknown;

};
```

### `MapStyleSource`[​](#mapstylesource "Direct link to mapstylesource")

```
type MapStyleSource = {

  type?: string;

  url?: string;

  tiles?: string[];

  minzoom?: number;

  maxzoom?: number;

  tileSize?: number;

  [key: string]: unknown;

};
```

### `MapStyleLayer`[​](#mapstylelayer "Direct link to mapstylelayer")

```
type MapStyleLayer = {

  id: string;

  type: string;

  source?: string;

  'source-layer'?: string;

  minzoom?: number;

  maxzoom?: number;

  filter?: unknown[];

  paint?: Record<string, unknown>;

  layout?: Record<string, unknown>;

  [key: string]: unknown;

};
```

## Example Returned Object[​](#example-returned-object "Direct link to Example Returned Object")

```
{

  "version": 8,

  "sources": {

    "basemap": {

      "type": "vector",

      "url": "https://example.com/styles/basemap.tilejson",

      "tiles": ["https://example.com/styles/tiles/{z}/{x}/{y}.pbf"],

      "minzoom": 0,

      "maxzoom": 14

    }

  },

  "layers": [

    {

      "id": "water",

      "type": "fill",

      "source": "basemap",

      "source-layer": "water"

    }

  ]

}
```

Two details matter here:

* `sources` and `layers` are always initialized, even when omitted in the input
* source URLs and tile templates are already normalized, so downstream code can use them directly

## Options[​](#options "Direct link to Options")

`MapStyleLoader` uses the `mapStyle` namespaced option group.

| Option                  | Type           | Default        | Description                                                                            |
| ----------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------- |
| `mapStyle.baseUrl`      | `string`       | `null`         | Base URL used to resolve relative source URLs and tile templates for in-memory styles. |
| `mapStyle.fetch`        | `typeof fetch` | global `fetch` | Fetch implementation used to load the style URL and source sub resources.              |
| `mapStyle.fetchOptions` | `RequestInit`  | `null`         | Request options forwarded to the selected fetch implementation.                        |

## Resolution Rules[​](#resolution-rules "Direct link to Resolution Rules")

When a source contains:

```
{

  "url": "./basemap.tilejson"

}
```

the loader resolves it against the base style URL. If that TileJSON contains:

```
{

  "tiles": ["./tiles/{z}/{x}/{y}.pbf"]

}
```

those tile templates are then resolved against the fetched TileJSON URL, not against the original style URL.

This two-step resolution is the main reason to use `MapStyleLoader` instead of parsing the JSON manually.

## Related APIs[​](#related-apis "Direct link to Related APIs")

* [`TileJSONLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/tilejson-loader.md)
* [`MVTSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)
* [`Map Styles`](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md)
