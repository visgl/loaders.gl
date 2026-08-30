---
title: WMC - Web Map Context
description: Understand the legacy OGC map-context document and the loaders.gl service boundary around it.
hide_title: true
page_style: designed
---

import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC context format"
  title="Know where WMC ends and service loading begins."
  description="Web Map Context packages a configured set of map layers. loaders.gl preserves this page as a format reference while the active implementation boundary remains XML parsing plus the WMS source APIs."
  tone="orange"
  meta={['WMC', 'Legacy OGC format', 'WMS services']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'WMS source', to: '/docs/modules/wms/formats/wms'}
  ]}
/>

<DocOrientation
  eyebrow="Implementation boundary"
  title="Read the context, then load the referenced service."
  description="A WMC document is configuration and references, not the map pixels themselves. Use XML parsing for the document and a service source for each referenced WMS endpoint."
  tone="orange"
  items={[
    {label: 'Document', value: 'Configured layers and service references'},
    {label: 'Parsing', value: '@loaders.gl/xml for legacy documents'},
    {label: 'Map data', value: 'WMSSourceLoader for referenced services'},
    {label: 'Status', value: 'No dedicated WMC loader in v5'}
  ]}
/>

<WmsDocsTabs active="wmc" />

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Web Map Context is a legacy OGC document format for saving and exchanging a configured set of map
layers.

## Feature support

| Capability | Support | Recommendation |
| --- | --- | --- |
| WMC document parsing | Not implemented | Parse XML with `@loaders.gl/xml` when maintaining legacy applications |
| WMC document writing | Not implemented | Keep application state in a modern JSON configuration |
| Referenced WMS layers | Supported separately | Use `WMSSourceLoader` for each referenced service |
| Modern context exchange | Not implemented | OWS Context is documented separately but also has no dedicated loader |

<ReferenceBoundary
  title="WMC format details"
  description="The support matrix below distinguishes the context document from the WMS services it references."
  tone="orange"
/>

This page is retained so users can distinguish WMC from WMS. loaders.gl v5 supports the referenced
WMS services, not the context document itself.

## References

- [OGC Web Map Context specification](https://www.ogc.org/standard/wmc/)
