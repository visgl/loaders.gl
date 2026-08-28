import {ClientExample} from '@site/src/components';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# ArcGIS VectorTileServer

<WmsDocsTabs active="arcgis-vector-tile-server" />

ArcGIS VectorTileServer endpoints publish Mapbox Vector Tile (MVT) data together with an ArcGIS
tile grid, style document, and sprite resources. `ArcGISVectorTileServerSourceLoader` implements the
loaders.gl `VectorTileSource` contract.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| Service metadata | Supported | `getMetadata()` exposes extent, CRS, LOD grid, style URL, and sprite URL |
| Raw vector tiles | Supported | `getTile()` returns the original PBF bytes |
| Decoded vector tiles | Supported | `getVectorTile()` decodes MVT through `@loaders.gl/mvt` |
| deck.gl tile data | Supported | `getTileData()` returns decoded WGS84 feature data |
| Geometry coordinates | WGS84 | Decoded features are transformed from tile-local coordinates for visualization |
| Layer filtering | Supported | Forward MVT loader options to select named source layers |
| Feature shape | Configurable | Standard MVT loader shape options are honored |
| ArcGIS style discovery | Supported | Metadata includes the published root style and sprite resource URLs |
| Style application | Application controlled | loaders.gl exposes style resources but does not translate the full ArcGIS style into deck props |
| Authentication | Supported | URL tokens and standard fetch options are preserved for all resources |
| deck.gl rendering | First class | `SourceLayer` consumes decoded vector tiles directly |

## Authentication

`createArcGISCredential` applies one exact-origin token to service metadata, styles, sprites, raw
tiles, and decoded tile requests. Explicit URL tokens take precedence. See the
[authentication guide](/docs/developer-guide/authentication).

## Raw and decoded tiles

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISVectorTileServerSourceLoader} from '@loaders.gl/services';

const source = createDataSource(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader]);

const metadata = await source.getMetadata();
const tileBytes = await source.getTile({z: 4, x: 6, y: 7});
const features = await source.getVectorTile({z: 4, x: 6, y: 7});
```

Use `getTile` when caching or forwarding the original PBF. Use `getVectorTile` when an application
needs decoded geometries and properties.

## Decoder options

MVT options are forwarded to `@loaders.gl/mvt`:

```ts
const source = createDataSource(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader], {
  mvt: {
    shape: 'geojson-table',
    layers: ['roads', 'labels']
  }
});
```

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const layer = new SourceLayer({
  id: 'arcgis-vector-tiles',
  data: vectorTileServiceUrl,
  loaders: SERVICE_LOADERS,
  pickable: true,
  getFillColor: [60, 140, 210],
  getLineColor: [20, 50, 80]
});
```

The ArcGIS style URL remains available in source metadata for applications that want to translate
or selectively reuse the service's authored style.

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS VectorTileServer" />
</div>

## References

- [ArcGIS REST API Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
