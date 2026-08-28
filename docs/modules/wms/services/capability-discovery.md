# Capability graph and service discovery

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
