---
title: ArcGIS MapServer protocol and formats
description: Display your published map through cached image tiles or dynamic map exports.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';
import {ArcGISDocsTabs} from '@site/src/components/docs/arcgis-docs-tabs';

<DocPageHeader
  format="arcgis-map-server"
  eyebrow="ArcGIS service protocol"
  title="ArcGIS MapServer protocol and formats"
  description="Display your published map through cached image tiles or dynamic map exports."
  tone="violet"
  links={[
    {label: 'Service guide and API', to: '/docs/modules/arcgis/arcgis-map-server'},
    {label: 'Authentication', to: '/docs/developer-guide/arcgis/authentication'}
  ]}
/>

<ArcGISDocsTabs service="arcgis-map-server" />

Use this path when you want the map as rendered by ArcGIS, including its server-side cartography. Cached tiles are useful for stable basemaps; dynamic exports can honor supported layer and time parameters.

<DocOrientation
  eyebrow="Service feature card"
  title="MapServer: connection and data contract"
  description="The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service."
  tone="violet"
  items={[
    {label: 'Endpoint', value: '/MapServer'},
    {label: 'Wire payload', value: 'PNG / JPEG image tiles'},
    {label: 'Client', value: 'Map tile source'},
    {label: 'Access', value: 'Read-only; public or explicitly authenticated'}
  ]}
/>

## Protocol and response formats

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is
JSON; data responses depend on the operation and the service configuration.

| Step | Protocol / request | Response meaning |
| --- | --- | --- |
| Discovery | Service resource with `f=json` | Layer list, extent, CRS and optional `tileInfo` |
| Cached maps | `/tile/{level}/{row}/{column}` | Encoded image bytes; cache format is defined by the service |
| Dynamic maps | `/export` | Image response for a requested bounding box and size |
| Coordinates | Published cache grid or export bounding box | ArcGIS row/column URLs correspond to source `z/y/x` addressing |

Map images preserve the server’s rendering but do not supply editable or queryable vector features. For feature attributes, use a FeatureServer layer or a queryable MapServer layer through the feature source.

## Detailed feature support

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its
limits or owning implementation, and **Not implemented** identifies an unavailable operation.
A server advertising a capability does not imply that this client implements it.

| Feature | loaders.gl support | Behavior and limits |
| --- | --- | --- |
| Cached images | Supported | Advertised `tileInfo` selects the published cache |
| Dynamic images | Supported | Export requests use Web Mercator tile bounds |
| Mode selection | Supported | `auto`, `cached` or `dynamic`; hosted caches need not offer export |
| Grid metadata | Supported | ArcGIS levels, origins, resolutions and tile dimensions normalized |
| Image decoding | Supported | Browser-supported image payloads; no vector geometry in map tiles |
| Layers, time and transparency | Supported for dynamic exports | Parameters affect new export requests, not an existing cache |
| Multiple service URLs | Supported | Deterministic URL-pool distribution |
| Authentication | Supported | Metadata, tiles and exports use the shared transport |
| Rendering | Supported | `SourceLayer` can display the returned image tiles |
| Feature queries | Separate client | Use the feature source for queryable MapServer layers that support its response requirements |
| Identify, legend and offline packages | Not wrapped | The tile source does not implement every MapServer operation |

## Connect your service

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content,
reuse your application's ArcGIS session through
[scoped authentication](/docs/developer-guide/arcgis/authentication). Check browser access from
your deployed origin, permissions and referenced resource hosts. See the
[practical setup checklist](/docs/modules/arcgis#before-connecting-your-application).

The [service guide](../arcgis-map-server) provides source construction and request examples. The
[service inventory](../services) covers additional ArcGIS families and unsupported operations.

## References

- [Esri MapServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
