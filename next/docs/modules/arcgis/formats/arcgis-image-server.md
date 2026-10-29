ArcGIS service protocol

![](/next/images/format-logos/arcgis-logo.jpg)Image

# ArcGIS ImageServer protocol and formats

Choose rendered imagery or numerical pixels from your existing imagery service.

[Service guide and API](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)[Authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

![](/next/images/format-logos/arcgis-logo.jpg)Image[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-image-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-image-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Use rendered images for display and LERC rasters when your application needs band values, masks or analysis. A colorized PNG and a numerical raster are different outputs from the same imagery service.

Service feature card

## ImageServer: connection and data contract

The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service.

01

Endpoint

/ImageServer

02

Wire payload

Image bytes or LERC pixels

03

Client

Image and tile sources

04

Access

Read-only; public or explicitly authenticated

## Protocol and response formats[​](#protocol-and-response-formats "Direct link to Protocol and response formats")

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is JSON; data responses depend on the operation and the service configuration.

| Step                | Protocol / request                        | Response meaning                                                  |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Discovery           | Service resource with `f=json`            | Extent, spatial reference, pixel and band metadata                |
| Viewport export     | `/exportImage` with bounds and dimensions | PNG, JPEG or another supported rendered image format              |
| Numerical export    | `/exportImage` with LERC format           | Compressed numeric bands and validity data, decoded locally       |
| Tile-shaped exports | Repeated `/exportImage` requests          | Web Mercator tile bounds; not the service’s native cache protocol |

For a familiar rendered view, request an image. For analytical pixels, use LERC and honor its mask/NoData information; do not interpret display colors as original band values. Native cache availability does not change the export-based behavior of this client.

## Detailed feature support[​](#detailed-feature-support "Direct link to Detailed feature support")

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its limits or owning implementation, and **Not implemented** identifies an unavailable operation. A server advertising a capability does not imply that this client implements it.

| Feature                                | loaders.gl support             | Behavior and limits                                                      |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Viewport images                        | Supported                      | `getImage()` or `exportImage()` returns decoded imagery                  |
| LERC rasters                           | Supported                      | `exportRaster()` returns typed bands, masks, dimensions and statistics   |
| Image tiles                            | Supported                      | `ArcGISImageTileSourceLoader` makes dynamic exports for tile bounds      |
| Native cached imagery tiles            | Not implemented                | This tile source does not consume `/tile` or cached elevation protocols  |
| Spatial references                     | Supported for viewport exports | `bboxSR` and `imageSR`; tile exports use Web Mercator                    |
| Bands and pixel types                  | Supported                      | Selection/parameters forwarded; numerical types retained in LERC results |
| Rendering and mosaic rules             | Supported                      | ArcGIS objects or serialized rules sent to the server                    |
| Changing parameters                    | Supported                      | Tile `updateParameters()` affects later exports                          |
| Authentication                         | Supported                      | Metadata, image exports and LERC use the shared transport                |
| Display integration                    | Images supported               | LERC needs application-defined visualization and NoData handling         |
| Pixel editing and raster analysis jobs | Not implemented                | Read-only export clients; no full raster-processing service wrapper      |

## Connect your service[​](#connect-your-service "Direct link to Connect your service")

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content, reuse your application's ArcGIS session through [scoped authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md). Check browser access from your deployed origin, permissions and referenced resource hosts. See the [practical setup checklist](https://loaders.gl/next/docs/modules/arcgis.md#before-connecting-your-application).

The [service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-image-server.md) provides source construction and request examples. The [service inventory](https://loaders.gl/next/docs/modules/arcgis/services.md) covers additional ArcGIS families and unsupported operations.

## References[​](#references "Direct link to References")

* [Esri ImageServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
* [LERC encoding](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)
