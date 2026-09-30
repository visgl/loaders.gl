---
title: Visualize ArcGIS data with deck.gl
description: Choose between explicitly loaded data and source-driven visualization.
---

# Visualize ArcGIS data with deck.gl

There are two data paths. You can explicitly query a service and pass the result to an ordinary
deck.gl layer, as in the [quickstart](/docs/developer-guide/arcgis), or let a loaders.gl `SourceLayer`
manage requests for the visible area. Neither path requires an ArcGIS Maps SDK view.

## Choose a data and rendering path

| ArcGIS source | Data | Visualization path | Important limit |
| --- | --- | --- | --- |
| FeatureServer | GeoJSON | GeoJsonLayer, or SourceLayer's vector adapter | Complete for selected bounds/filters or throws; configurable partial-result API available |
| MapServer | Cached or exported images | SourceLayer's image tile adapter | No feature picking from pixels |
| ImageServer | Viewport images / exported tiles | SourceLayer's image or tile adapter | Rendering rules are handled by the server |
| ImageServer LERC | Numerical bands and masks | Application-selected raster visualization | Values need a color mapping and NoData handling |
| VectorTileServer | Decoded MVT geometry | SourceLayer's vector tile adapter | Styling comes from your layer props; not a complete ArcGIS style renderer |
| SceneServer | Delegated I3S source | Profile-compatible 3D adapter | Inspect profile, coordinate system and renderer support separately |

## Source-driven loading

```sh
npm install @loaders.gl/deck-layers
```

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';

const layer = new SourceLayer({
  id: 'arcgis-features',
  data: featureLayerUrl,
  loaders: ARCGIS_LOADERS,
  crs: 'EPSG:4326',
  requestCrs: 'EPSG:4326',
  sourceOptions: {core: {type: 'arcgis-feature-server'}},
  pickable: true
});

// Add layer to your Deck or DeckGL layers array.
```

For feature layers, request geographic output and viewport bounds explicitly with `crs` and
`requestCrs` so a service's native projected coordinates are not interpreted as longitude/latitude.

Use `core.type: 'arcgis-image-server'` for a viewport image or
`core.type: 'arcgis-image-server-tiles'` for exported image tiles. Both use ImageServer URLs, so
explicit selection makes the intended representation clear. Add credentials through
`sourceOptions.core.credentials`; see [authentication](/docs/developer-guide/arcgis/authentication).

For tile sources, `SourceLayer.extent` uses longitude/latitude. Some ArcGIS services advertise
projected metadata bounds; supply a geographic extent explicitly instead of interpreting those
numbers as degrees. The gallery uses `extent: [-180, -85.051129, 180, 85.051129]` for its
Web Mercator tile viewers. This does not add support for arbitrary tile grids.

## Style features for your application

Use feature properties for color, size, elevation and tooltips. Choose scatterplots, arcs, paths,
polygons or aggregation layers according to the data. Explicitly fetched GeoJSON features can be
mapped to the input shape expected by those layers. Arrow and binary outputs need compatible
adapters; do not pass an arbitrary Arrow table directly to a layer that expects row objects.

A service's renderer, label, popup or Arcade definition is not automatically evaluated by loaders.gl.
Choose a small set of fields and visual encodings and make that interpretation visible to users.
Retain service/data attribution when adding a basemap or combining providers.

## ArcGIS Maps SDK applications

The 2D [ArcGIS examples](/examples/arcgis) host deck.gl overlays in ArcGIS `MapView` through
[`DeckLayer`](https://deck.gl/docs/api-reference/arcgis/deck-layer). They use Esri’s public light gray
basemap with native zoom, fullscreen and attribution controls. Item-explorer users can hide both
basemap geometry and labels while inspecting a service.

```ts
import {DeckLayer} from '@deck.gl/arcgis';
import ArcGISMap from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';

const overlay = new DeckLayer({'deck.layers': [sourceLayer]});
const view = new MapView({
  container,
  map: new ArcGISMap({basemap: 'gray-vector', layers: [overlay]}),
  center: [-85.75, 37.75],
  zoom: 7
});
// Call view.destroy() when the application removes this map.
```

Keep ArcGIS SDK imports and lifecycle in the application. The loaders.gl ArcGIS module does not
acquire an Esri SDK dependency. The shared [example map host](https://github.com/visgl/loaders.gl/blob/master/examples/website/shared/arcgis-map.tsx)
loads the SDK after mount for server-rendered pages, releases SDK resources on unmount, and explicitly
aligns 512-pixel map LODs with deck.gl. Programmatic fits round zoom down to an integer level so all
requested data stays visible. This integration is 2D; it does not make SceneServer profiles renderable
in this map.

`@deck.gl/arcgis` 9.4.0 has an ESM packaging issue: one import references an unpublished sibling
source file. The repository applies a small [Yarn patch](https://github.com/visgl/loaders.gl/blob/master/.yarn/patches/@deck.gl-arcgis-npm-9.4.0-4c40c78c8b.patch)
that uses the public `@deck.gl/core` `MapView` export. Application builds using that release may need
this fix until an upstream release corrects the import.

## Examples

The [ArcGIS gallery](/examples/arcgis) links to the live applications, matching service pages and
source code. Each implemented service page embeds its corresponding application. Numerical
rasters and scene metadata are labeled according to what the example actually does.
