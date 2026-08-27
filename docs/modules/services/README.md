# ArcGIS Services

The `@loaders.gl/services` module provides framework-independent sources for ArcGIS REST services.

It supports FeatureServer, ImageServer, MapServer, and VectorTileServer endpoints. OGC protocols
such as WMS, WMTS, WFS, GML, and CSW remain in [`@loaders.gl/wms`](/docs/modules/wms).

## Installation

```bash
npm install @loaders.gl/services @loaders.gl/core
```

## Capability discovery

For applications that need to choose among services, the module can discover an ArcGIS REST
 directory and normalize the shared service capability contract: service family, formats, and coordinate systems. The
capability graph is intentionally separate from source loading, so direct source construction
remains the simplest path when the endpoint is already known.

```ts
import {
  createServiceSource,
  discoverArcGISCapabilities,
  selectArcGISService
} from '@loaders.gl/services';

const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services');
const imagery = graph && selectArcGISService(graph, {kind: 'image', format: 'lerc'});
const source = imagery && createServiceSource(
  imagery.url,
  {},
  imagery.capabilities.type
);
```

Discovery performs one metadata request per discovered service. Pass a custom `fetch` function when
using authentication, a proxy, or a test transport.
