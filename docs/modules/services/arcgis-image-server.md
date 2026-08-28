import {ClientExample} from '@site/src/components';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# ArcGIS ImageServer

<WmsDocsTabs active="arcgis-image-server" />

ArcGIS ImageServer endpoints expose rendered imagery and analytical raster data. loaders.gl offers
an `ImageSource` for viewport exports and a `TileSource` for tiled visualization or analysis.

## Feature support

| Capability | Image source | Tile source | API and behavior |
| --- | --- | --- | --- |
| Service metadata | Supported | Supported | Normalizes title, description, extent, CRS, and attribution |
| Rendered imagery | `getImage()` / `exportImage()` | `getTile()` | Decodes PNG, JPEG, and other browser image formats |
| Analytical LERC | `exportRaster()` | `getTile()` with `format: 'lerc'` | Returns typed bands, mask, dimensions, statistics, and NoData metadata |
| Bounding box and output CRS | Supported | Web Mercator tiles | Viewport exports accept `bboxSR` and `imageSR` |
| Pixel type | Supported | Forwarded parameter | ArcGIS integer and floating-point pixel types are preserved by LERC |
| Band selection | Supported | Forwarded parameter | Use `bandIds` or tile request parameters |
| Rendering and mosaic rules | Supported | Supported | Pass ArcGIS JSON objects or serialized rules |
| Runtime parameter updates | Per request | Supported | Tile source `updateParameters()` affects subsequent requests |
| URL pools | Not applicable | Supported | Optional URL pool distributes tile exports deterministically |
| Authentication | Supported | Supported | URL tokens and standard fetch options are preserved |
| deck.gl rendering | First class for images | First class for image tiles | Analytical LERC requires an application-selected visualization |

## Authentication

`createArcGISCredential` applies one exact-origin token to metadata, exports, cached tiles, and
LERC requests. Configure it in `core.credentials`; explicit URL tokens take precedence. See the
[authentication guide](/docs/developer-guide/authentication).

## Viewport images

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISImageServerSourceLoader} from '@loaders.gl/services';

const source = createDataSource(imageServerUrl, [ArcGISImageServerSourceLoader]);

const metadata = await source.getMetadata();
const image = await source.getImage({
  layers: [],
  boundingBox: [[-124, 32], [-114, 42]],
  crs: 'EPSG:4326',
  width: 1024,
  height: 768,
  format: 'image/png'
});
```

`getImage()` uses the generic `ImageSource` request shape. `exportImage()` exposes ArcGIS-specific
controls when an application needs exact pixel, band, mosaic, or rendering behavior:

```ts
const image = await source.exportImage({
  bbox: [-124, 32, -114, 42],
  bboxSR: 4326,
  imageSR: 3857,
  width: 1024,
  height: 768,
  format: 'png32',
  renderingRule: {rasterFunction: 'Hillshade'}
});
```

Defaults can be supplied under `arcgis-image-server.exportImageParameters` and overridden by each
request.

## Image tiles

`ArcGISImageTileSourceLoader` requests one `/exportImage` response per Web Mercator tile:

```ts
import {ArcGISImageTileSourceLoader} from '@loaders.gl/services';

const tileSource = createDataSource(imageServerUrl, [ArcGISImageTileSourceLoader], {
  'arcgis-image-server-tiles': {
    tileSize: 512,
    format: 'png32',
    parameters: {transparent: true}
  }
});

tileSource.updateParameters({
  renderingRule: JSON.stringify({rasterFunction: 'Hillshade'})
});
```

The tile source is useful even when the server does not publish a cached tile endpoint. Requests
are generated from the visible XYZ tile bounds.

## Analytical LERC rasters

Use `exportRaster()` when pixel values must remain analysis-ready:

```ts
const raster = await source.exportRaster({
  bbox: [-122.5, 37.7, -122.3, 37.85],
  bboxSR: 'EPSG:4326',
  imageSR: 'EPSG:4326',
  width: 512,
  height: 512,
  pixelType: 'F32',
  bandIds: [0]
});

const firstBand = raster.pixels[0];
const validMask = raster.mask;
```

For tiled analysis, set `format: 'lerc'` under `arcgis-image-server-tiles`. The source decodes each
tile directly with `@loaders.gl/lerc`; it does not convert values through an 8-bit display image.

LERC data is deliberately not colorized automatically. Applications should choose a band, value
domain, color ramp, and NoData policy appropriate to the dataset before uploading values to the GPU.

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const layer = new SourceLayer({
  id: 'land-cover',
  data: imageServerUrl,
  loaders: SERVICE_LOADERS,
  opacity: 0.8
});
```

Use `core.type: 'arcgis-image-server-tiles'` in `sourceOptions` when tiled export is preferred over
one viewport-sized image.

## Live examples

### Viewport image

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS Image Server" />
</div>

- [ImageServer export tiles](/examples/tiles/arcgis-image-server-tiles)
- [Analytical ImageServer LERC](/examples/tiles/arcgis-image-server-lerc)

## References

- [ArcGIS REST API Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
- [ArcGIS REST API Export Image](https://developers.arcgis.com/rest/services-reference/enterprise/export-image/)
- [LERC codec](https://esri.github.io/lerc/)
