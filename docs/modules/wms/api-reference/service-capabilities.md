# Service capabilities

The WMS module exposes a protocol-neutral `ServiceCapabilities` shape for applications that need
to inspect WMS, WMTS, WFS, and ArcGIS services without branching on every service's native metadata
model.

```typescript
import {normalizeWMTSCapabilities} from '@loaders.gl/wms';

const capabilities = normalizeWMTSCapabilities(wmtsCapabilities, serviceUrl);
console.log(capabilities.layers, capabilities.crs, capabilities.formats);
```

The normalizers preserve the native response under `formatSpecificMetadata` while exposing common
service identity, layers, coordinate systems, formats, and operations.
