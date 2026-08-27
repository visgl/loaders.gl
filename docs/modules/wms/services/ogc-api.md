# OGC API

The `@loaders.gl/wms` module provides a deliberately small compatibility layer for modern OGC
APIs. It supports the common discovery shape and the two most useful data paths for applications:
feature collections, tiled resources, coverages, and environmental observations.

## Features

```js
import {OGCAPIFeaturesSourceLoader} from '@loaders.gl/wms';
import {createDataSource} from '@loaders.gl/core';

const source = createDataSource('https://demo.ldproxy.net/daraa', [OGCAPIFeaturesSourceLoader], {
  'ogc-api': {collectionId: 'VegetationSrf'}
});

const metadata = await source.getMetadata();
const page = await source.getFeatures({
  layers: 'VegetationSrf',
  boundingBox: [
    [12.4, 41.8],
    [12.6, 42.0]
  ]
});
```

The result is a loaders.gl GeoJSON table. The adapter sends the standard `bbox` and optional `crs`
query parameters. Paging links and advanced filters can be followed directly using the underlying
fetch function when needed.

## Tiles

The tiles adapter expands a server-advertised template. Both OGC API names and conventional XYZ
placeholders are accepted:

```js
import {OGCAPITilesSourceLoader} from '@loaders.gl/wms';

const source = OGCAPITilesSourceLoader.createDataSource('https://example.com/api', {
  'ogc-api': {
    tileTemplate: 'https://example.com/api/tiles/{tileMatrix}/{tileRow}/{tileCol}.png'
  }
});

const tileBytes = await source.getTile({z: 3, x: 4, y: 5});
```

This is intentionally a minimal adapter. It does not attempt to implement every OGC API extension,
server-side filter language, or conformance class.

## Coverages

The coverage adapter supports collection discovery and the standard collection coverage endpoint.
It returns JSON coverage representations as objects and binary representations as `ArrayBuffer`
values, leaving decoding to the appropriate loaders.

```js
import {OGCAPICoveragesSourceLoader} from '@loaders.gl/wms';

const source = OGCAPICoveragesSourceLoader.createDataSource('https://example.com/ogcapi', {
  'ogc-api-coverages': {collectionId: 'temperature'}
});
const coverage = await source.getCoverage({
  bbox: [-10, 40, 10, 50],
  subset: ['Lat(40,50)'],
  format: 'application/json'
});
```

## Environmental data

OGC API EDR provides a small query client for position, area, radius, cube, trajectory, and
corridor endpoints. The response is returned in the representation selected by the server,
including GeoJSON and CoverageJSON.

```js
import {OGCAPIEDRSourceLoader} from '@loaders.gl/wms';

const source = OGCAPIEDRSourceLoader.createDataSource('https://example.com/edr');
const observations = await source.query({
  collectionId: 'weather',
  queryType: 'position',
  coords: 'POINT(10 20)',
  datetime: '2025-01-01',
  parameterName: ['temperature', 'wind']
});
```

## WCS

`WCSCoverageSource` handles WCS `GetCapabilities` and `GetCoverage` requests. It preserves
binary coverage responses and routes LERC responses through `@loaders.gl/lerc` when a Core API is
available.

```js
import {WCSCoverageSourceLoader} from '@loaders.gl/wms';

const source = WCSCoverageSourceLoader.createDataSource('https://example.com/wcs', {
  wcs: {coverageId: 'elevation', format: 'image/tiff'}
});
const bytes = await source.getCoverage({bbox: [-10, 40, 10, 50]});
```

For a live feature-service example, see the [ldproxy demo](https://demo.ldproxy.net/daraa). Live
services are not used by the test suite; repository fixtures remain the source of truth for CI.
