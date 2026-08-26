import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ClientExample} from '@site/src/components';

# ArcGIS MapServer

<WmsDocsTabs active="arcgis-map-server" />

ArcGIS MapServer services can expose cached map tiles through the REST `/tile/{z}/{y}/{x}`
endpoint. loaders.gl provides an image `TileSource` for these services and reads the service's
metadata document to expose zoom levels, extent, spatial reference, and attribution.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISMapTileSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  [ArcGISMapTileSourceLoader],
  {type: 'arcgis-map-server'}
);

const metadata = await source.getMetadata();
const image = await source.getTile({x: 2, y: 1, z: 2});
```

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS MapServer" />
</div>

## References

- [ArcGIS MapServer REST API](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
