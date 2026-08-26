import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# ArcGIS Image Server

<WmsDocsTabs active="arcgis-image-server" />

ArcGIS Image Server endpoints expose raster imagery and image services through the ArcGIS REST API.

## loaders.gl Support

loaders.gl provides `_ArcGISImageServerSourceLoader` as an experimental image source loader for
ArcGIS `ImageServer` endpoints. It can load service metadata and request exported images for a
viewport. `ArcGISImageTileSourceLoader` provides a deck.gl-compatible tile source backed by the
`/exportImage` endpoint.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {_ArcGISImageServerSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(url, [_ArcGISImageServerSourceLoader], {
  core: {type: 'arcgis-image-server'}
});

const metadata = await source.getMetadata();
const image = await source.getImage({
  layers: '0',
  boundingBox: [
    [-124, 32],
    [-114, 42]
  ],
  width: 1024,
  height: 768
});
```

For deck.gl tile rendering, use `ArcGISImageTileSourceLoader`. It requests one `/exportImage`
image per tile and supports ImageServer rendering parameters.

```ts
import {ArcGISImageTileSourceLoader} from '@loaders.gl/wms';

const tileSource = createDataSource(url, [ArcGISImageTileSourceLoader], {
  type: 'arcgis-image-server-tiles',
  'arcgis-image-server-tiles': {
    tileSize: 512,
    parameters: {format: 'png32', transparent: true}
  }
});

tileSource.updateParameters({renderingRule: JSON.stringify({rasterFunction: 'Hillshade'})});
```

## Analytical LERC rasters

ArcGIS ImageServer can return [LERC](https://esri.github.io/lerc/) instead of a display image.
Use `exportRaster` when the result should remain a typed, analysis-ready raster:

```js
const raster = await source.exportRaster({
  bbox: [-122.5, 37.7, -122.3, 37.85],
  bboxSR: 'EPSG:4326',
  imageSR: 'EPSG:4326',
  width: 512,
  height: 512,
  format: 'lerc',
  pixelType: 'F32'
});

// raster.pixels contains one typed array per band; raster.mask carries validity.
```

For tile workflows, set `format: 'lerc'` under `arcgis-image-server-tiles`. The tile source then
returns decoded `LERCData` values without an image round trip.

## Example

- [ArcGIS Image Server example](/examples/tiles/arcgis-image-server)
- [ArcGIS ImageServer tiles example](/examples/tiles/arcgis-image-server-tiles)

## References

- [ArcGIS REST API Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service.htm)
