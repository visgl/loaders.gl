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
| FeatureServer | GeoJSON | GeoJsonLayer, or SourceLayer's vector adapter | One query is not a complete-dataset guarantee |
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
  sourceOptions: {core: {type: 'arcgis-feature-server'}},
  pickable: true
});

// Add layer to your Deck or DeckGL layers array.
```

Use `core.type: 'arcgis-image-server'` for a viewport image or
`core.type: 'arcgis-image-server-tiles'` for exported image tiles. Both use ImageServer URLs, so
explicit selection makes the intended representation clear. Add credentials through
`sourceOptions.core.credentials`; see [authentication](/docs/developer-guide/arcgis/authentication).

## Style features for your application

Use feature properties for color, size, elevation and tooltips. Choose scatterplots, arcs, paths,
polygons or aggregation layers according to the data. Explicitly fetched GeoJSON features can be
mapped to the input shape expected by those layers. Arrow and binary outputs need compatible
adapters; do not pass an arbitrary Arrow table directly to a layer that expects row objects.

A service's renderer, label, popup or Arcade definition is not automatically evaluated by loaders.gl.
Choose a small set of fields and visual encodings and make that interpretation visible to users.
Retain service/data attribution when adding a basemap or combining providers.

## ArcGIS Maps SDK applications

Embedding deck.gl into an ArcGIS view is a separate integration supplied by deck.gl. Consult its
[current basemap integration documentation](https://deck.gl/docs/get-started/using-with-map).
This module reads service data; it does not create or manage an ArcGIS Maps SDK view.

## Examples

The [ArcGIS gallery](/examples/arcgis) links to the live applications, matching service pages and
source code. Each implemented service page embeds its corresponding application. Numerical
rasters and scene metadata are labeled according to what the example actually does.
