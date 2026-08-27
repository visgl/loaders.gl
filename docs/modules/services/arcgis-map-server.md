import {ClientExample} from '@site/src/components';

# ArcGIS MapServer

ArcGIS MapServer services can expose cached map tiles through the REST `/tile/{z}/{y}/{x}`
endpoint or render dynamic tiles through `/export`. loaders.gl provides an image `TileSource` that
selects cached tiles automatically when `tileInfo` is advertised and can render dynamic services
with runtime parameters.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISMapTileSourceLoader} from '@loaders.gl/services';

const source = createDataSource(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  [ArcGISMapTileSourceLoader],
  {type: 'arcgis-map-server'}
);

const metadata = await source.getMetadata();
const image = await source.getTile({x: 2, y: 1, z: 2});
```

For dynamic services, select export mode and configure the request parameters. A pool of service
URLs can be supplied for simple request distribution.

```ts
const source = createDataSource(url, [ArcGISMapTileSourceLoader], {
  type: 'arcgis-map-server',
  'arcgis-map-server': {
    mode: 'dynamic',
    tileSize: 512,
    urls: ['https://tiles-a.example.com/MapServer', 'https://tiles-b.example.com/MapServer'],
    exportParameters: {layers: 'show:0', format: 'jpgpng'}
  }
});

source.updateParameters({time: '2024-01-01'});
```

ArcGIS ImageServer export tiles are available through `ArcGISImageTileSourceLoader`, which uses
the corresponding `/exportImage` endpoint and supports the same tile-source integration.

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS MapServer" />
</div>

## References

- [ArcGIS MapServer REST API](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
