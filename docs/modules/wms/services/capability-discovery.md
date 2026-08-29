---
title: Capability graph and service discovery
description: Discover related geospatial service endpoints, preserve their capabilities, and rank candidates without forcing a universal runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Service discovery"
  title="Find the right endpoint before creating a source."
  description="Service directories and OGC landing pages describe relationships, formats, coordinate systems, and quality at different levels of detail. discoverServiceGraph records that information so an application can make an explicit choice."
  tone="mint"
  meta={['Relationship graph', 'Capability ranking', 'Explicit source creation']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Universal runtime', to: '/docs/modules/wms/services/universal-service-runtime'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="Discovery without lock-in"
  title="Collect options, keep the decision in application code."
  description="The graph follows known service relationships and normalizes the capabilities it can identify. It does not crawl arbitrary pages or hide protocol-specific source behavior."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Follow typed links, landing pages, and service-directory children.'},
    {label: 'Describe', value: 'Preserve type, formats, CRS, tile grids, latency, and quality.'},
    {label: 'Rank', value: 'Apply application preferences to produce candidate endpoints.'},
    {label: 'Create', value: 'Pass the chosen endpoint to its concrete source loader.'}
  ]}
/>

<ReferenceBoundary
  title="Discovery graph details"
  description="The reference below defines graph contents, ranking inputs, serialization, invalidation, and the boundary between discovery and source execution."
  tone="mint"
/>

`discoverServiceGraph` follows service-directory JSON and OGC landing-page links and returns a
serializable `CapabilityGraph`. The graph records what was discovered without forcing applications
through a universal service abstraction.

## Feature support

| Capability | Support | Behavior |
| --- | --- | --- |
| OGC landing-page links | Supported | Follows typed and related service links |
| ArcGIS-style service directories | Supported | Records listed child service endpoints |
| Relationship graph | Supported | Preserves `service`, `service-desc`, and other link relations |
| Endpoint capabilities | Supported | Stores type, formats, CRS, tile grid, and quality when available |
| Ranking | Supported | Preferences include type, format, CRS, latency, and quality |
| Latency observations | Supported | Optional measurements contribute to ranking |
| Serialization | Supported | Graph data can be cached outside the runtime |
| Automatic invalidation | Application controlled | Persisted graphs require an application cache policy |
| Deep web crawling | Not performed | Discovery follows service relationships, not arbitrary pages |
| Source creation | Explicit | Select an endpoint, then use its concrete source loader |

```ts
import {discoverServiceGraph} from '@loaders.gl/wms';

const graph = await discoverServiceGraph('https://example.com/rest/services');
const preferred = graph.rank({
  types: ['wmts', 'arcgis-image-server'],
  formats: ['image/png'],
  crs: ['EPSG:3857']
});
```

Each ranked item remains a normal endpoint description. Applications can inspect the reasoning,
apply business rules, or create a source with the relevant loader. Discovery is therefore useful
without becoming a mandatory abstraction layer for direct service access.
