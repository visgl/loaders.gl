---
title: Using ArcGIS with loaders.gl and deck.gl
description: Build geospatial visualization applications with data already hosted in ArcGIS.
---

# Build visualizations with your ArcGIS data

ArcGIS hosts and manages your data. `@loaders.gl/arcgis` reads selected ArcGIS REST services into
features, images, raster values, tiles, and scene sources that applications can visualize with
deck.gl. You can use it with ArcGIS Online or an accessible ArcGIS Enterprise endpoint without
adding the ArcGIS Maps SDK to your application.

Start with a service URL and a small public feature layer. Then choose the data representation and
visualization that fit your application. The module is a read-only data client; it does not reproduce
an ArcGIS web map's styling, popups, expressions, or editing tools.

## Choose your starting point

| What you have | Next step |
| --- | --- |
| A feature layer | [Query and filter features](/docs/developer-guide/arcgis/feature-layers) |
| An ArcGIS item page or item ID | Find the service URL on the item details page, then choose a layer |
| Secured organizational data | [Choose authentication](/docs/developer-guide/arcgis/authentication) |
| Map, imagery, vector tile or scene data | [Check the service inventory](/docs/modules/arcgis/services) |
| A visualization to build | [Use deck.gl](/docs/developer-guide/arcgis/deck-gl) or explore [examples](/examples/arcgis) |
| An existing ArcGIS Maps SDK application | Use deck.gl's ArcGIS integration for the view; this module addresses service data access |

## Install

```sh
npm install @loaders.gl/core @loaders.gl/arcgis @deck.gl/core @deck.gl/layers
```

Use matching loaders.gl package versions. These pages describe the v5 development API; check that
your installed release exports `@loaders.gl/arcgis` before copying the examples.

## Display a public feature layer

Create a page with a map container:

```html
<div id="map" style="position: relative; width: 100%; height: 500px"></div>
```

In your application's TypeScript entry point:

```ts
import {Deck} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const serviceUrl =
  'https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0';

const source = await load(serviceUrl, ArcGISFeatureServerSourceLoader);
const features = await source.getFeatures({
  format: 'geojson',
  crs: 'EPSG:4326',
  boundingBox: [[-85.9, 37.6], [-85.6, 37.9]]
});

const deck = new Deck({
  parent: document.getElementById('map')!,
  initialViewState: {longitude: -85.75, latitude: 37.75, zoom: 10},
  controller: true,
  layers: [new GeoJsonLayer({
    id: 'bicycle-routes',
    data: features,
    pickable: true,
    getLineColor: [0, 100, 220],
    lineWidthMinPixels: 3
  })]
});

// Call deck.finalize() when your application removes the visualization.
```

This draws the requested features on a plain background. A basemap is optional. Attribute the
original data provider according to the service's item details and copyright information.
[Open the interactive example](/examples/tiles/arcgis-feature-server) to explore viewport loading.

`getFeatures()` currently makes one request. A service can limit the returned record count, and
this adapter does not expose a completeness guarantee. Keep queries small and consult the
[query limitations](/docs/developer-guide/arcgis/feature-layers#record-limits-and-completeness)
before using the result for a complete count or analysis.

## Recognize ArcGIS URLs

| URL ending | Meaning | How to use it |
| --- | --- | --- |
| `/home/item.html?id=…` | Portal item page | Find its service URL; automatic item resolution is not implemented |
| `/sharing/rest/content/items/{id}` | Portal item resource | Not a data-source URL; use an application portal client |
| `/FeatureServer` | Service with layers and potentially tables | Select an explicit layer; do not assume layer 0 exists |
| `/FeatureServer/0` | One feature layer | Pass the layer URL to the feature loader |
| `/MapServer` | Map images or cached map tiles | Use the MapServer source; this does not query vector features |
| `/ImageServer` | Imagery or numerical raster service | Choose viewport image export or exported tiles |
| `/VectorTileServer` | Vector tile service | Read raw or decoded MVT; styling is application-controlled |
| `/SceneServer/layers/0` | One I3S scene layer | Inspect its profile, CRS and supported rendering route |

An Enterprise portal and its services may use different hosts. Use the actual service address,
check browser CORS access, and authorize each trusted origin explicitly.

## How imports work

The package root exports metadata-only loaders. `load()` selects and asynchronously imports the
runtime implementation. `ARCGIS_LOADERS` can select among conventional service URLs; set
`core.type` explicitly when an ImageServer URL could mean either viewport imagery or tile exports.

```ts
import {load} from '@loaders.gl/core';
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';

const source = await load(serviceUrl, ARCGIS_LOADERS, {
  core: {type: 'arcgis-feature-server'}
});
```

For synchronous source construction, import the implementation explicitly:

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoaderWithParser} from '@loaders.gl/arcgis/arcgis-feature-server-source-loader';

const source = createDataSource(serviceUrl, [ArcGISFeatureServerSourceLoaderWithParser], {});
```

Source construction is synchronous in this example; network methods remain asynchronous. Passing
root metadata directly to `createDataSource()` produces an actionable error. Authentication and
discovery have dedicated subpaths, documented in their guides.
