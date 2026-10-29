ArcGIS service protocol

![](/next/images/format-logos/arcgis-logo.jpg)Vector Tile

# ArcGIS VectorTileServer protocol and formats

Read your published vector tiles and style their decoded features in your application.

[Service guide and API](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)[Authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md)

![](/next/images/format-logos/arcgis-logo.jpg)Vector Tile[Service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-vector-tile-server.md)[Full example](https://loaders.gl/next/examples/tiles/arcgis-vector-tile-server)[Support and gaps](https://loaders.gl/next/docs/modules/arcgis/services.md)[All ArcGIS examples](https://loaders.gl/next/examples/arcgis)

Use this path for tiled vector delivery from an existing vector tile layer. The source exposes tile data and published style-resource locations; your renderer decides how to draw and label features.

Service feature card

## VectorTileServer: connection and data contract

The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service.

01

Endpoint

/VectorTileServer

02

Wire payload

MVT protobuf / PBF

03

Client

Vector tile source

04

Access

Read-only; public or explicitly authenticated

## Protocol and response formats[​](#protocol-and-response-formats "Direct link to Protocol and response formats")

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is JSON; data responses depend on the operation and the service configuration.

| Step            | Protocol / request                         | Response meaning                                                      |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Discovery       | Service resource with `f=json`             | Extent, tile grid and resource locations                              |
| Tile data       | `/tile/{level}/{row}/{column}.pbf`         | Mapbox Vector Tile protobuf with named layers and tile-local geometry |
| Style resources | Published style JSON and related resources | Sprite and glyph references are presentation inputs, not geometry     |
| Client output   | MVT decoding                               | Raw bytes or features transformed for WGS84 visualization             |

PBF here means the MVT tile encoding, not FeatureServer’s PBF query encoding. Decoded tiles are intended for tiled visualization; use a feature layer when you need complete records or analysis independent of zoom level.

## Detailed feature support[​](#detailed-feature-support "Direct link to Detailed feature support")

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its limits or owning implementation, and **Not implemented** identifies an unavailable operation. A server advertising a capability does not imply that this client implements it.

| Feature                           | loaders.gl support            | Behavior and limits                                                 |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| Service and grid metadata         | Supported                     | Extent, CRS, LODs and published style/sprite URLs                   |
| Original tile bytes               | Supported                     | `getTile()` returns PBF for forwarding or caching                   |
| Decoded features                  | Supported                     | `getVectorTile()` delegates to the MVT decoder                      |
| Visualization coordinates         | Supported                     | `getTileData()` supplies WGS84 features                             |
| Source-layer selection            | Supported                     | MVT decoder options filter named layers                             |
| Decoded shape                     | Configurable                  | MVT loader shape options apply                                      |
| Style discovery                   | Supported                     | Resource URLs retained in metadata                                  |
| Style translation and labels      | Not implemented               | No complete ArcGIS style, glyph or sprite-to-deck.gl renderer       |
| Authentication                    | Supported for source requests | Explicit trusted origins also apply to separately fetched resources |
| Rendering                         | Supported                     | `SourceLayer` displays decoded tiles with application styling       |
| Complete feature inventory        | Not provided                  | Tiles can be clipped, simplified and repeated across boundaries     |
| Editing and offline tile packages | Not implemented               | Read-only online tile client                                        |

## Connect your service[​](#connect-your-service "Direct link to Connect your service")

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content, reuse your application's ArcGIS session through [scoped authentication](https://loaders.gl/next/docs/developer-guide/arcgis/authentication.md). Check browser access from your deployed origin, permissions and referenced resource hosts. See the [practical setup checklist](https://loaders.gl/next/docs/modules/arcgis.md#before-connecting-your-application).

The [service guide](https://loaders.gl/next/docs/modules/arcgis/arcgis-vector-tile-server.md) provides source construction and request examples. The [service inventory](https://loaders.gl/next/docs/modules/arcgis/services.md) covers additional ArcGIS families and unsupported operations.

## References[​](#references "Direct link to References")

* [Esri VectorTileServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
* [MVT encoding](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)
