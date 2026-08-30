---
title: OWS Context
description: Understand the OGC context format and the service APIs that handle its referenced resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC context format"
  title="Treat OWS Context as a resource map, not a data service."
  description="OWS Context packages configured geospatial resources and service links. loaders.gl does not expose a dedicated context loader, but its service sources can load the referenced WMS, WMTS, WFS, and catalog endpoints."
  tone="violet"
  meta={['OWS Context', 'Atom and JSON', 'Referenced services']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Service sources', to: '/docs/modules/services'}
  ]}
/>

<DocOrientation
  eyebrow="Implementation boundary"
  title="Use the context to discover; use sources to load."
  description="The context document describes what is available and where. Parse its Atom or JSON representation, then hand each referenced endpoint to the source API that understands that service."
  tone="violet"
  items={[
    {label: 'Document', value: 'Configured geospatial resources and links'},
    {label: 'Encodings', value: 'Atom/XML and JSON variants'},
    {label: 'Service APIs', value: 'WMS, WMTS, WFS, and catalog sources'},
    {label: 'Status', value: 'No dedicated OWS Context loader in v5'}
  ]}
/>

<ReferenceBoundary
  title="OWS Context details"
  description="The support matrix below clarifies what is represented by the context document and which loaders handle its referenced services."
  tone="violet"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

OWS Context is an OGC exchange format for packaging a collection of configured geospatial
resources and services.

## Feature support

| Capability | Support | Recommendation |
| --- | --- | --- |
| OWS Context Atom encoding | Not implemented | Parse the XML with `@loaders.gl/xml` and adapt links in application code |
| OWS Context JSON encoding | Not implemented | Load JSON normally and pass referenced endpoints to service loaders |
| Referenced WMS services | Supported separately | Use `WMSSourceLoader` |
| Referenced WMTS services | Supported separately | Use `WMTSSourceLoader` |
| Referenced WFS services | Supported separately | Use `WFSSourceLoader` |
| General service discovery | Supported separately | Use `discoverServiceGraph` or a `CSWSourceLoader` catalog |

This page is retained to clarify the boundary between a context document and the services it can
reference. loaders.gl v5 does not expose an OWS Context loader.

## References

- [OGC OWS Context standard](https://www.ogc.org/standard/owc/)
