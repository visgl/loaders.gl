ArcGIS module · ArcGIS raster source

![](/next/images/format-logos/arcgis-logo.jpg)Image

# ArcGIS ImageServer

Use your published imagery as rendered images or analytical LERC pixels. Choose viewport exports or tile-shaped exports to match your application.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-image-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-image-server.md)[ArcGIS service API](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/arcgis-logo.jpg)Image[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-image-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-image-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Remote data, explicit steps

## Discover once. Request only what the application needs.

Service sources keep endpoint metadata, request construction, and decoded results separate. That makes a remote dataset behave like a predictable part of the data path.

01 · discover

### ArcGIS REST endpoint

A service directory exposes layers, operations, and formats.

FeatureServerImageServerSceneServer

pla&#x6E;**→**

02 · request

### Request the useful subset

Choose features, images, tiles, or scene content for this view.

wherebboxoutFieldssize

normaliz&#x65;**→**

[03 · application result](https://loaders.gl/next/docs/modules/arcgis.md)

### [VectorSource · ImageSource · Tileset3DSource](https://loaders.gl/next/docs/modules/arcgis.md)

[The application receives a source contract rather than a vendor-specific client.<!-- --> ↗](https://loaders.gl/next/docs/modules/arcgis.md)

The source owns protocol details; the application owns how returned features, pixels, tiles, or tables are used.

What it provides

## Choose rendered pixels or analytical raster values.

ImageServer can serve display-ready images or typed raster data. loaders.gl keeps those paths explicit so an application can choose the right representation for rendering or analysis.

01

Metadata

Extent, CRS, bands, and service details

02

Images

Viewport exports and tiled imagery

03

Raster

LERC values, masks, and NoData metadata

04

Requests

Rules, bands, formats, and credentials

Detailed guide

## ImageServer reference

The sections below cover support, authentication, viewport images, analytical raster output, tiles, and parameters.

ArcGIS ImageServer endpoints expose rendered imagery and analytical raster data. loaders.gl offers an `ImageSource` for viewport exports and a `TileSource` for tiled visualization or analysis.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                  | Image source                   | Tile source                       | API and behavior                                                       |
| --------------------------- | ------------------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| Service metadata            | ✅ Supported                   | ✅ Supported                      | Normalizes title, description, extent, CRS, and attribution            |
| Rendered imagery            | `getImage()` / `exportImage()` | `getTile()`                       | Decodes PNG, JPEG, and other browser image formats                     |
| Analytical LERC             | `exportRaster()`               | `getTile()` with `format: 'lerc'` | Returns typed bands, mask, dimensions, statistics, and NoData metadata |
| Bounding box and output CRS | ✅ Supported                   | Web Mercator tiles                | Viewport exports accept `bboxSR` and `imageSR`                         |
| Pixel type                  | ✅ Supported                   | Forwarded parameter               | ArcGIS integer and floating-point pixel types are preserved by LERC    |
| Band selection              | ✅ Supported                   | Forwarded parameter               | Use `bandIds` or tile request parameters                               |
| Rendering and mosaic rules  | ✅ Supported                   | ✅ Supported                      | Pass ArcGIS JSON objects or serialized rules                           |
| Runtime parameter updates   | Per request                    | ✅ Supported                      | Tile source `updateParameters()` affects subsequent requests           |
| URL pools                   | Not applicable                 | ✅ Supported                      | Optional URL pool distributes tile exports deterministically           |
| Authentication              | ✅ Supported                   | ✅ Supported                      | URL tokens and standard fetch options are preserved                    |
| deck.gl rendering           | First class for images         | First class for image tiles       | Analytical LERC requires an application-selected visualization         |

## Authentication[​](#authentication "Direct link to Authentication")

`createArcGISCredential` applies one exact-origin token to metadata, image/tile exports, and LERC requests. Configure it in `core.credentials`; explicit URL tokens take precedence. See the [authentication guide](https://loaders.gl/next/docs/developer-guide/authentication.md).

## Viewport images[​](#viewport-images "Direct link to Viewport images")

```
import {load} from '@loaders.gl/core';

import {ArcGISImageServerSourceLoader} from '@loaders.gl/arcgis';



const source = await load(imageServerUrl, [ArcGISImageServerSourceLoader]);



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

`getImage()` uses the generic `ImageSource` request shape. `exportImage()` exposes ArcGIS-specific controls when an application needs exact pixel, band, mosaic, or rendering behavior:

```
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

Defaults can be supplied under `arcgis-image-server.exportImageParameters` and overridden by each request.

## Image tiles[​](#image-tiles "Direct link to Image tiles")

`ArcGISImageTileSourceLoader` requests one `/exportImage` response per Web Mercator tile:

```
import {ArcGISImageTileSourceLoader} from '@loaders.gl/arcgis';



const tileSource = await load(imageServerUrl, [ArcGISImageTileSourceLoader], {

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

The tile source is useful even when the server does not publish a cached tile endpoint. Requests are generated from the visible XYZ tile bounds.

## Analytical LERC rasters[​](#analytical-lerc-rasters "Direct link to Analytical LERC rasters")

Use `exportRaster()` when pixel values must remain analysis-ready:

```
const raster = await source.exportRaster({

  bbox: [-122.5, 37.7, -122.3, 37.85],

  bboxSR: 4326,

  imageSR: 4326,

  width: 512,

  height: 512,

  pixelType: 'F32',

  bandIds: [0]

});



const firstBand = raster.pixels[0];

const validMask = raster.mask;
```

For tiled analysis, set `format: 'lerc'` under `arcgis-image-server-tiles`. The source decodes each tile directly with `@loaders.gl/raster/lerc`; it does not convert values through an 8-bit display image.

LERC data is deliberately not colorized automatically. Applications should choose a band, value domain, color ramp, and NoData policy appropriate to the dataset before uploading values to the GPU.

## deck.gl integration[​](#deckgl-integration "Direct link to deck.gl integration")

```
import {SourceLayer} from '@loaders.gl/deck-layers';

import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';



const layer = new SourceLayer({

  id: 'land-cover',

  data: imageServerUrl,

  loaders: ARCGIS_LOADERS,

  opacity: 0.8

});
```

For the tile viewer, also set `extent: [-180, -85.051129, 180, 85.051129]` on `SourceLayer` when service metadata bounds use projected coordinates. Use `core.type: 'arcgis-image-server-tiles'` in `sourceOptions` when tiled export is preferred over one viewport-sized image.

* [ImageServer export tiles](https://loaders.gl/next/examples/tiles/arcgis-image-server-tiles)
* [Analytical ImageServer LERC](https://loaders.gl/next/examples/tiles/arcgis-image-server-lerc)

## References[​](#references "Direct link to References")

* [ArcGIS REST API Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
* [ArcGIS REST API Export Image](https://developers.arcgis.com/rest/services-reference/enterprise/export-image/)
* [LERC codec](https://esri.github.io/lerc/)

## Explore numerical values[​](#explore-numerical-values "Direct link to Explore numerical values")

This live example reads LERC bands and applies an illustrative numeric color ramp. It is not the service’s rendered legend. Missing values remain transparent.

⛶⛶ Explore fullscreen

[Full numerical raster example](https://loaders.gl/next/examples/tiles/arcgis-image-server-lerc) · [Exported tile example](https://loaders.gl/next/examples/tiles/arcgis-image-server-tiles)
