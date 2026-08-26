# Capability graph and service discovery

`discoverServiceGraph` follows service-directory JSON and OGC landing-page links and returns a
serializable `CapabilityGraph`. Endpoint preferences can rank results after capabilities are
attached by an application or catalog adapter.

```ts
import {discoverServiceGraph} from '@loaders.gl/wms';

const graph = await discoverServiceGraph('https://example.com/rest/services');
const preferred = graph.rank({
  types: ['wmts', 'arcgis-image-server'],
  formats: ['image/png'],
  crs: ['EPSG:3857']
});
```

The graph keeps relationships (`service`, `service-desc`, and other link relations), endpoint
types, optional capability summaries, and measured latency so applications can persist and rank
service choices without reimplementing discovery logic.
