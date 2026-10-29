ArcGIS service protocol

![](/next/images/format-logos/arcgis-logo.jpg)Feature

# ArcGIS FeatureServer protocol and formats

Read your published feature layers and tables as bounded queries with explicit completeness.

[Service guide and API](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)[Authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

![](/next/images/format-logos/arcgis-logo.jpg)Feature[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-feature-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-feature-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Use this path when you need your layer’s geometries and attributes for custom styling, filtering or analysis. Select the layer or table from your existing service; the service root can contain several.

Service feature card

## FeatureServer: connection and data contract

The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service.

01

Endpoint

/FeatureServer / layer ID

02

Wire payload

GeoJSON or attribute JSON

03

Client

Feature query source

04

Access

Read-only; public or explicitly authenticated

## Protocol and response formats[​](#protocol-and-response-formats "Direct link to Protocol and response formats")

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is JSON; data responses depend on the operation and the service configuration.

| Step             | Protocol / request                                | Response meaning                                                     |
| ---------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| Discovery        | Service and layer resources with `f=json`         | Fields, object ID, capabilities, record limits and spatial reference |
| Selection        | Numbered layer `/query`; GET or form-encoded POST | SQL `where`, fields, IDs and spatial filters                         |
| Spatial response | `f=geojson`                                       | WGS84 features; not Esri JSON geometry                               |
| Table response   | `f=json`                                          | Attributes normalized to records with null geometry                  |
| Summary response | Count, IDs and extent query JSON                  | Used for query planning and completeness evidence                    |

A service may advertise Esri JSON or PBF in addition to GeoJSON. That does not mean this client can decode those spatial representations. Use the feature guide to check your layer’s GeoJSON capabilities and query completion.

## Detailed feature support[​](#detailed-feature-support "Direct link to Detailed feature support")

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its limits or owning implementation, and **Not implemented** identifies an unavailable operation. A server advertising a capability does not imply that this client implements it.

| Feature                           | loaders.gl support | Behavior and limits                                                                      |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| Layer choice                      | Supported          | Layer URL or explicit `layers` selection for a service root                              |
| Automatic pagination              | Bounded            | Ordered offsets when supported; object-ID batches otherwise                              |
| Completeness                      | Checked            | `getFeatures()` throws on incomplete results; default cap is 100,000 records             |
| Progressive pages                 | Supported          | `queryFeaturePages()` yields page results and progress, not network-streamed JSON tokens |
| Partial results                   | Explicit           | `queryFeatures()` reports `complete` and `reason`; `queryFeaturePage()` is only one page |
| Filters and fields                | Supported          | Server-side query parameters; complete queries own ordering and offsets                  |
| Output shapes                     | Supported          | GeoJSON, binary geometry or Arrow; Arrow/binary are client conversions                   |
| Nonspatial tables                 | Partial            | Null-geometry rows in GeoJSON/Arrow; binary geometry rejects them                        |
| Coordinates                       | Bounded            | XY bounds; `requestCrs` for request bounds; spatial output is EPSG:4326                  |
| Authentication and cancellation   | Supported          | Shared transport and `AbortSignal` across metadata and pages                             |
| Snapshot consistency              | Not provided       | Concurrent edits can change membership even when counts agree                            |
| PBF, Esri JSON geometry and edits | Not implemented    | No feature PBF decoder, attachments, sync or mutation API                                |

## Connect your service[​](#connect-your-service "Direct link to Connect your service")

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content, reuse your application's ArcGIS session through [scoped authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md). Check browser access from your deployed origin, permissions and referenced resource hosts. See the [practical setup checklist](https://loaders.gl/next/docs/modules/arcgis.md#before-connecting-your-application).

The [service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-feature-server.md) provides source construction and request examples. The [service inventory](https://loaders.gl/next/docs/modules/arcgis/services.md) covers additional ArcGIS families and unsupported operations.

## References[​](#references "Direct link to References")

* [Esri FeatureServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
* [Esri feature query reference](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/)
* [Pagination, completeness and output shapes](https://loaders.gl/next/docs/developer-guide/arcgis/feature-layers.md)
