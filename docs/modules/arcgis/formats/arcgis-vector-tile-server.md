---
title: ArcGIS VectorTileServer protocol and formats
description: Read your published vector tiles and style their decoded features in your application.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';
import {ArcGISDocsTabs} from '@site/src/components/docs/arcgis-docs-tabs';

<DocPageHeader
  format="arcgis-vector-tile-server"
  eyebrow="ArcGIS service protocol"
  title="ArcGIS VectorTileServer protocol and formats"
  description="Read your published vector tiles and style their decoded features in your application."
  tone="violet"
  links={[
    {label: 'Service guide and API', to: '/docs/modules/arcgis/arcgis-vector-tile-server'},
    {label: 'Authentication', to: '/docs/developer-guide/arcgis/authentication'}
  ]}
/>

<ArcGISDocsTabs service="arcgis-vector-tile-server" />

Use this path for tiled vector delivery from an existing vector tile layer. The source exposes tile data and published style-resource locations; your renderer decides how to draw and label features.

<DocOrientation
  eyebrow="Service feature card"
  title="VectorTileServer: connection and data contract"
  description="The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service."
  tone="violet"
  items={[
    {label: 'Endpoint', value: '/VectorTileServer'},
    {label: 'Wire payload', value: 'MVT protobuf / PBF'},
    {label: 'Client', value: 'Vector tile source'},
    {label: 'Access', value: 'Read-only; public or explicitly authenticated'}
  ]}
/>

## Protocol and response formats

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is
JSON; data responses depend on the operation and the service configuration.

| Step | Protocol / request | Response meaning |
| --- | --- | --- |
| Discovery | Service resource with `f=json` | Extent, tile grid and resource locations |
| Tile data | `/tile/{level}/{row}/{column}.pbf` | Mapbox Vector Tile protobuf with named layers and tile-local geometry |
| Style resources | Published style JSON and related resources | Sprite and glyph references are presentation inputs, not geometry |
| Client output | MVT decoding | Raw bytes or features transformed for WGS84 visualization |

PBF here means the MVT tile encoding, not FeatureServer’s PBF query encoding. Decoded tiles are intended for tiled visualization; use a feature layer when you need complete records or analysis independent of zoom level.

## Detailed feature support

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its
limits or owning implementation, and **Not implemented** identifies an unavailable operation.
A server advertising a capability does not imply that this client implements it.

| Feature | loaders.gl support | Behavior and limits |
| --- | --- | --- |
| Service and grid metadata | Supported | Extent, CRS, LODs and published style/sprite URLs |
| Original tile bytes | Supported | `getTile()` returns PBF for forwarding or caching |
| Decoded features | Supported | `getVectorTile()` delegates to the MVT decoder |
| Visualization coordinates | Supported | `getTileData()` supplies WGS84 features |
| Source-layer selection | Supported | MVT decoder options filter named layers |
| Decoded shape | Configurable | MVT loader shape options apply |
| Style discovery | Supported | Resource URLs retained in metadata |
| Style translation and labels | Not implemented | No complete ArcGIS style, glyph or sprite-to-deck.gl renderer |
| Authentication | Supported for source requests | Explicit trusted origins also apply to separately fetched resources |
| Rendering | Supported | `SourceLayer` displays decoded tiles with application styling |
| Complete feature inventory | Not provided | Tiles can be clipped, simplified and repeated across boundaries |
| Editing and offline tile packages | Not implemented | Read-only online tile client |

## Connect your service

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content,
reuse your application's ArcGIS session through
[scoped authentication](/docs/developer-guide/arcgis/authentication). Check browser access from
your deployed origin, permissions and referenced resource hosts. See the
[practical setup checklist](/docs/modules/arcgis#before-connecting-your-application).

The [service guide](../arcgis-vector-tile-server) provides source construction and request examples. The
[service inventory](../services) covers additional ArcGIS families and unsupported operations.

## References

- [Esri VectorTileServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
- [MVT encoding](/docs/modules/mvt/formats/mvt)
