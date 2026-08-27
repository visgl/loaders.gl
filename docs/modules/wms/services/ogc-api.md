# OGC API

The `@loaders.gl/wms` module provides a deliberately small compatibility layer for modern OGC
APIs. It supports the common discovery shape and the two most useful data paths for applications:
feature collections and tiled resources.

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

For a live feature-service example, see the [ldproxy demo](https://demo.ldproxy.net/daraa). Live
services are not used by the test suite; repository fixtures remain the source of truth for CI.
