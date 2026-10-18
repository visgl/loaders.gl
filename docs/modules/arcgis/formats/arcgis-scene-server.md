---
title: ArcGIS SceneServer protocol and formats
description: Connect an existing scene layer to the appropriate I3S content and rendering path.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';
import {ArcGISDocsTabs} from '@site/src/components/docs/arcgis-docs-tabs';

<DocPageHeader
  format="arcgis-scene-server"
  eyebrow="ArcGIS service protocol"
  title="ArcGIS SceneServer protocol and formats"
  description="Connect an existing scene layer to the appropriate I3S content and rendering path."
  tone="violet"
  links={[
    {label: 'Service guide and API', to: '/docs/modules/arcgis/arcgis-scene-server'},
    {label: 'Authentication', to: '/docs/developer-guide/arcgis/authentication'}
  ]}
/>

<ArcGISDocsTabs service="arcgis-scene-server" />

Use this path for layers already published as ArcGIS scene services. Choose a layer explicitly and inspect its profile and coordinate reference before selecting a 3D renderer.

<DocOrientation
  eyebrow="Service feature card"
  title="SceneServer: connection and data contract"
  description="The protocol describes what ArcGIS can publish; the support matrix below describes the loaders.gl client. Check the capabilities of your own service."
  tone="violet"
  items={[
    {label: 'Endpoint', value: '/SceneServer / layer ID'},
    {label: 'Wire payload', value: 'I3S JSON and binary resources'},
    {label: 'Client', value: 'Scene layer source'},
    {label: 'Access', value: 'Read-only; public or explicitly authenticated'}
  ]}
/>

## Protocol and response formats

ArcGIS REST resources use HTTP URLs with named operations and request parameters. Metadata is
JSON; data responses depend on the operation and the service configuration.

| Step | Protocol / request | Response meaning |
| --- | --- | --- |
| Discovery | Scene service and layer JSON resources | Layer type, version, capabilities and spatial reference |
| Hierarchy | I3S node or node-page resources | Visibility/traversal metadata handled by the I3S runtime |
| Content | Referenced I3S geometry, attributes and textures | Binary payloads and image/texture encodings depend on the published profile |
| Queries | Layer `/query` when supported | ArcGIS query response metadata; separate from mesh traversal |

SceneServer is a resource protocol; I3S describes its scene structure and content. A scene layer is not interchangeable with a complete web scene. Validate your layer profile, texture/geometry encodings and renderer together.

## Detailed feature support

**Supported** describes the named client path, **Bounded / Partial / Delegated** identifies its
limits or owning implementation, and **Not implemented** identifies an unavailable operation.
A server advertising a capability does not imply that this client implements it.

| Feature | loaders.gl support | Behavior and limits |
| --- | --- | --- |
| Layer selection | Supported | Explicit layer URL or root service with configured `layerId` |
| Layer metadata | Supported | Profile, storage/version, extent, capabilities and CRS |
| 3D object mesh and Point | Delegated | I3S source handles hierarchy and content decoding |
| Point Cloud | Delegated | I3S point-cloud source selected from metadata |
| Traversal and resource loading | Delegated | `getTilesetSource()` returns the appropriate source |
| Read-only feature query | Supported subset | `query()` / `getFeatures()` preserve raw response metadata |
| Local aggregation | Supported subset | Explicit scene-aggregation helper groups already queried features |
| Authentication | Supported | Authorize service and referenced asset origins explicitly |
| Rendering | Application-specific | Metadata inspection is not a full 3D rendering test |
| CRS and content encodings | Profile-dependent | Consult I3S support and renderer requirements before deployment |
| Building roots and web scenes | Separate I3S paths | Not equivalent to this layer facade |
| Editing and full expression evaluation | Not implemented | Renderer/popup expressions remain metadata |

## Connect your service

Copy the REST URL from your ArcGIS item details or Services Directory. For secured content,
reuse your application's ArcGIS session through
[scoped authentication](/docs/developer-guide/arcgis/authentication). Check browser access from
your deployed origin, permissions and referenced resource hosts. See the
[practical setup checklist](/docs/modules/arcgis#before-connecting-your-application).

The [service guide](../arcgis-scene-server) provides source construction and request examples. The
[service inventory](../services) covers additional ArcGIS families and unsupported operations.

## References

- [Esri SceneServer REST reference](https://developers.arcgis.com/rest/services-reference/enterprise/scene-service/)
- [I3S structure and encoding support](/docs/modules/i3s/formats/i3s)
