Service discovery

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# Find the right endpoint before creating a source.

Service directories and OGC landing pages describe relationships, formats, coordinate systems, and quality at different levels of detail. discoverServiceGraph records that information so an application can make an explicit choice.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[Universal runtime](https://loaders.gl/next/docs/modules/ogc/wms/services/universal-service-runtime.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/services/universal-service-runtime.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

Discovery without lock-in

## Collect options, keep the decision in application code.

The graph follows known service relationships and normalizes the capabilities it can identify. It does not crawl arbitrary pages or hide protocol-specific source behavior.

01

Discover

Follow typed links, landing pages, and service-directory children.

02

Describe

Preserve type, formats, CRS, tile grids, latency, and quality.

03

Rank

Apply application preferences to produce candidate endpoints.

04

Create

Pass the chosen endpoint to its concrete source loader.

Detailed guide

## Discovery graph details

The reference below defines graph contents, ranking inputs, serialization, invalidation, and the boundary between discovery and source execution.

`discoverServiceGraph` follows service-directory JSON and OGC landing-page links and returns a serializable `CapabilityGraph`. The graph records what was discovered without forcing applications through a universal service abstraction.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                       | Support                   | Behavior                                                         |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| OGC landing-page links           | ✅ Supported              | Follows typed and related service links                          |
| ArcGIS-style service directories | ✅ Supported              | Records listed child service endpoints                           |
| Relationship graph               | ✅ Supported              | Preserves `service`, `service-desc`, and other link relations    |
| Endpoint capabilities            | ✅ Supported              | Stores type, formats, CRS, tile grid, and quality when available |
| Ranking                          | ✅ Supported              | Preferences include type, format, CRS, latency, and quality      |
| Latency observations             | ✅ Supported              | Optional measurements contribute to ranking                      |
| Serialization                    | ✅ Supported              | Graph data can be cached outside the runtime                     |
| Automatic invalidation           | ❌ Application controlled | Persisted graphs require an application cache policy             |
| Deep web crawling                | ❌ Not performed          | Discovery follows service relationships, not arbitrary pages     |
| Source creation                  | ✅ Explicit               | Select an endpoint, then use its concrete source loader          |

```
import {discoverServiceGraph} from '@loaders.gl/ogc/wms';



const graph = await discoverServiceGraph('https://example.com/rest/services');

const preferred = graph.rank({

  types: ['wmts', 'arcgis-image-server'],

  formats: ['image/png'],

  crs: ['EPSG:3857']

});
```

Each ranked item remains a normal endpoint description. Applications can inspect the reasoning, apply business rules, or create a source with the relevant loader. Discovery is therefore useful without becoming a mandatory abstraction layer for direct service access.
