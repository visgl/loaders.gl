ArcGIS service protocol

![](/next/images/format-logos/arcgis-logo.jpg)Map

# ArcGIS MapServer protocol and formats

Display your published map through cached image tiles or dynamic map exports.

[Service guide and API](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)[Authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

![](/next/images/format-logos/arcgis-logo.jpg)Map[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-map-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-map-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Use this path when you want the map as rendered by ArcGIS, including its server-side cartography. Cached tiles are useful for stable basemaps; dynamic exports can honor supported layer and time parameters.

Service feature card

## MapServer: connection and data contract

The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service.

01

Endpoint

/MapServer

02

Wire payload

PNG / JPEG image tiles

03

Client

Map tile source

04

Access

Read-only; public or explicitly authenticated

## Protocol and response formats[​](#protocol-and-response-formats "Direct link to Protocol and response formats")

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is JSON; data responses depend on the operation and the service configuration.

| Step         | Protocol / request                          | Response meaning                                               |
| ------------ | ------------------------------------------- | -------------------------------------------------------------- |
| Discovery    | Service resource with `f=json`              | Layer list, extent, CRS and optional `tileInfo`                |
| Cached maps  | `/tile/{level}/{row}/{column}`              | Encoded image bytes; cache format is defined by the service    |
| Dynamic maps | `/export`                                   | Image response for a requested bounding box and size           |
| Coordinates  | Published cache grid or export bounding box | ArcGIS row/column URLs correspond to source `z/y/x` addressing |

Map images preserve the server’s rendering but do not supply editable or queryable vector features. For feature attributes, use a FeatureServer layer or a queryable MapServer layer through the feature source.

## Detailed feature support[​](#detailed-feature-support "Direct link to Detailed feature support")

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its limits or owning implementation, and **Not implemented** identifies an unavailable operation. A server advertising a capability does not imply that this client implements it.

| Feature                               | loaders.gl support            | Behavior and limits                                                                          |
| ------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| Cached images                         | Supported                     | Advertised `tileInfo` selects the published cache                                            |
| Dynamic images                        | Supported                     | Export requests use Web Mercator tile bounds                                                 |
| Mode selection                        | Supported                     | `auto`, `cached` or `dynamic`; hosted caches need not offer export                           |
| Grid metadata                         | Supported                     | ArcGIS levels, origins, resolutions and tile dimensions normalized                           |
| Image decoding                        | Supported                     | Browser-supported image payloads; no vector geometry in map tiles                            |
| Layers, time and transparency         | Supported for dynamic exports | Parameters affect new export requests, not an existing cache                                 |
| Multiple service URLs                 | Supported                     | Deterministic URL-pool distribution                                                          |
| Authentication                        | Supported                     | Metadata, tiles and exports use the shared transport                                         |
| Rendering                             | Supported                     | `SourceLayer` can display the returned image tiles                                           |
| Feature queries                       | Separate client               | Use the feature source for queryable MapServer layers that support its response requirements |
| Identify, legend and offline packages | Not wrapped                   | The tile source does not implement every MapServer operation                                 |

## Connect your service[​](#connect-your-service "Direct link to Connect your service")

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content, reuse your application's ArcGIS session through [scoped authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md). Check browser access from your deployed origin, permissions and referenced resource hosts. See the [practical setup checklist](https://loaders.gl/next/docs/modules/arcgis.md#before-connecting-your-application).

The [service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-map-server.md) provides source construction and request examples. The [service inventory](https://loaders.gl/next/docs/modules/arcgis/services.md) covers additional ArcGIS families and unsupported operations.

## References[​](#references "Direct link to References")

* [Esri MapServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
