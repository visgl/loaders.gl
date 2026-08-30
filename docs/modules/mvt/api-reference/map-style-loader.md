---
title: MapStyleLoader
description: Resolve MapLibre and Mapbox style metadata for tile workflows.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MVT module · style API"
  title="MapStyleLoader"
  description="Parse a MapLibre or Mapbox style document and resolve its tile-source metadata into a form that applications can inspect or pass into tile workflows."
  tone="blue"
  meta={['From v4.4', 'Map styles', 'TileJSON resolution']}
  links={[
    {label: 'Map style format', to: '/docs/modules/mvt/formats/map-style'},
    {label: 'MVT source', to: '/docs/modules/mvt/api-reference/mvt-source-loader'},
    {label: 'MVT module', to: '/docs/modules/mvt'}
  ]}
/>

<DocOrientation
  eyebrow="What it resolves"
  title="Turn a style document into usable source metadata."
  description="MapStyleLoader preserves the style while resolving relative URLs and referenced TileJSON documents, so applications can derive tile endpoints without reimplementing URL handling."
  tone="blue"
  items={[
    {label: 'Input', value: 'MapLibre or Mapbox style JSON'},
    {label: 'Sources', value: 'Resolved URLs and TileJSON fields'},
    {label: 'Layers', value: 'Preserved style layers and unknown fields'},
    {label: 'Boundary', value: 'Metadata resolution, not rendering'}
  ]}
/>

<ReferenceBoundary
  title="MapStyleLoader reference"
  description="The sections below document loading, URL resolution, direct resolution, and the fields handled by the loader."
  tone="blue"
/>

The `MapStyleLoader` parses MapLibre / Mapbox style JSON and returns a normalized style object with
resolved tile-source metadata.

It is designed for applications that need to inspect style documents, derive tile endpoints, or
bridge style metadata into other runtimes such as deck.gl tile workflows.

| Loader                | Characteristic                                           |
| --------------------- | -------------------------------------------------------- |
| File Extension        | `.json`                                                  |
| File Type             | Text                                                     |
| File Format           | [Map Styles](/docs/modules/mvt/formats/map-style)        |
| Data Format           | `ResolvedMapStyle`                                       |
| Decoder Type          | Asynchronous                                             |
| Worker Thread Support | No                                                       |
| Streaming Support     | No                                                       |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {MapStyleLoader} from '@loaders.gl/mvt';

const style = await load('https://example.com/styles/base/style.json', MapStyleLoader);
```

With explicit URL resolution options:

```typescript
import {parse} from '@loaders.gl/core';
import {MapStyleLoader} from '@loaders.gl/mvt';

const style = await parse(styleJsonText, MapStyleLoader, {
  mapStyle: {
    baseUrl: 'https://example.com/styles/base/style.json',
    fetch: customFetch,
    fetchOptions: {headers: {'x-token': token}}
  }
});
```

Direct style resolution without the loader:

```typescript
import {resolveMapStyle} from '@loaders.gl/mvt';

const style = await resolveMapStyle('https://example.com/styles/base/style.json');
```

## What the loader resolves

`MapStyleLoader`:

- parses the style JSON
- preserves unknown fields on the style, sources, and layers
- resolves relative `sources.*.url` values
- fetches TileJSON documents referenced from `sources.*.url`
- merges fetched TileJSON fields into the source
- resolves `sources.*.tiles[]` entries relative to the correct base URL
- guarantees that `sources` and `layers` are present in the returned object

It does not fetch or expand other style sub resources such as:

- `sprite`
- `glyphs`
- external images referenced by renderer-specific metadata

Those fields remain untouched in the returned metadata.

## Returned Data Format

The loader returns a `ResolvedMapStyle` object.

```typescript
type ResolvedMapStyle = MapStyle & {
  sources: Record<string, MapStyleSource>;
  layers: MapStyleLayer[];
};
```

### `MapStyle`

```typescript
type MapStyle = {
  version?: number;
  metadata?: Record<string, unknown>;
  sources?: Record<string, MapStyleSource>;
  layers?: MapStyleLayer[];
  [key: string]: unknown;
};
```

### `MapStyleSource`

```typescript
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

### `MapStyleLayer`

```typescript
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

## Example Returned Object

```json
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

- `sources` and `layers` are always initialized, even when omitted in the input
- source URLs and tile templates are already normalized, so downstream code can use them directly

## Options

`MapStyleLoader` uses the `mapStyle` namespaced option group.

| Option                  | Type             | Default | Description |
| ----------------------- | ---------------- | ------- | ----------- |
| `mapStyle.baseUrl`      | `string`         | `null`  | Base URL used to resolve relative source URLs and tile templates for in-memory styles. |
| `mapStyle.fetch`        | `typeof fetch`   | global `fetch` | Fetch implementation used to load the style URL and source sub resources. |
| `mapStyle.fetchOptions` | `RequestInit`    | `null`  | Request options forwarded to the selected fetch implementation. |

## Resolution Rules

When a source contains:

```json
{
  "url": "./basemap.tilejson"
}
```

the loader resolves it against the base style URL. If that TileJSON contains:

```json
{
  "tiles": ["./tiles/{z}/{x}/{y}.pbf"]
}
```

those tile templates are then resolved against the fetched TileJSON URL, not against the original
style URL.

This two-step resolution is the main reason to use `MapStyleLoader` instead of parsing the JSON
manually.

## Related APIs

- [`TileJSONLoader`](/docs/modules/mvt/api-reference/tilejson-loader)
- [`MVTSourceLoader`](/docs/modules/mvt/api-reference/mvt-source-loader)
- [`Map Styles`](/docs/modules/mvt/formats/map-style)
