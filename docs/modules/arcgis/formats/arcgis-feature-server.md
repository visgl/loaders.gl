---
title: ArcGIS FeatureServer protocol and formats
description: Read your published feature layers and tables as bounded queries with explicit completeness.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';
import {ArcGISDocsTabs} from '@site/src/components/docs/arcgis-docs-tabs';

<DocPageHeader
  format="arcgis-feature-server"
  eyebrow="ArcGIS service protocol"
  title="ArcGIS FeatureServer protocol and formats"
  description="Read your published feature layers and tables as bounded queries with explicit completeness."
  tone="violet"
  links={[
    {label: 'Service guide and API', to: '/docs/modules/arcgis/arcgis-feature-server'},
    {label: 'Authentication', to: '/docs/developer-guide/arcgis/authentication'}
  ]}
/>

<ArcGISDocsTabs service="arcgis-feature-server" />

Use this path when you need your layer’s geometries and attributes for custom styling, filtering or analysis. Select the layer or table from your existing service; the service root can contain several.

<DocOrientation
  eyebrow="Service feature card"
  title="FeatureServer: connection and data contract"
  description="The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service."
  tone="violet"
  items={[
    {label: 'Endpoint', value: '/FeatureServer / layer ID'},
    {label: 'Wire payload', value: 'GeoJSON or attribute JSON'},
    {label: 'Client', value: 'Feature query source'},
    {label: 'Access', value: 'Read-only; public or explicitly authenticated'}
  ]}
/>

## Protocol and response formats

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is
JSON; data responses depend on the operation and the service configuration.

| Step | Protocol / request | Response meaning |
| --- | --- | --- |
| Discovery | Service and layer resources with `f=json` | Fields, object ID, capabilities, record limits and spatial reference |
| Selection | Numbered layer `/query`; GET or form-encoded POST | SQL `where`, fields, IDs and spatial filters |
| Spatial response | `f=geojson` | WGS84 features; not Esri JSON geometry |
| Table response | `f=json` | Attributes normalized to records with null geometry |
| Summary response | Count, IDs and extent query JSON | Used for query planning and completeness evidence |

A service may advertise Esri JSON or PBF in addition to GeoJSON. That does not mean this client can decode those spatial representations. Use the feature guide to check your layer’s GeoJSON capabilities and query completion.

## Detailed feature support

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its
limits or owning implementation, and **Not implemented** identifies an unavailable operation.
A server advertising a capability does not imply that this client implements it.

| Feature | loaders.gl support | Behavior and limits |
| --- | --- | --- |
| Layer choice | Supported | Layer URL or explicit `layers` selection for a service root |
| Automatic pagination | Bounded | Ordered offsets when supported; object-ID batches otherwise |
| Completeness | Checked | `getFeatures()` throws on incomplete results; default cap is 100,000 records |
| Progressive pages | Supported | `queryFeaturePages()` yields page results and progress, not network-streamed JSON tokens |
| Partial results | Explicit | `queryFeatures()` reports `complete` and `reason`; `queryFeaturePage()` is only one page |
| Filters and fields | Supported | Server-side query parameters; complete queries own ordering and offsets |
| Output shapes | Supported | GeoJSON, binary geometry or Arrow; Arrow/binary are client conversions |
| Nonspatial tables | Partial | Null-geometry rows in GeoJSON/Arrow; binary geometry rejects them |
| Coordinates | Bounded | XY bounds; `requestCrs` for request bounds; spatial output is EPSG:4326 |
| Authentication and cancellation | Supported | Shared transport and `AbortSignal` across metadata and pages |
| Snapshot consistency | Not provided | Concurrent edits can change membership even when counts agree |
| PBF, Esri JSON geometry and edits | Not implemented | No feature PBF decoder, attachments, sync or mutation API |

## Connect your service

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content,
reuse your application's ArcGIS session through
[scoped authentication](/docs/developer-guide/arcgis/authentication). Check browser access from
your deployed origin, permissions and referenced resource hosts. See the
[practical setup checklist](/docs/modules/arcgis#before-connecting-your-application).

The [service guide](../arcgis-feature-server) provides source construction and request examples. The
[service inventory](../services) covers additional ArcGIS families and unsupported operations.

## References

- [Esri FeatureServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
- [Esri feature query reference](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/)
- [Pagination, completeness and output shapes](/docs/developer-guide/arcgis/feature-layers)
