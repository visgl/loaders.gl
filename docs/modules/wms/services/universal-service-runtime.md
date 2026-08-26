# Universal service runtime

`ServiceRuntime` provides one entry point for OGC and ArcGIS sources. It detects a source from its
URL, preserves a cached source instance, and offers shared request retries, cancellation, headers,
and telemetry.

```ts
import {ServiceRuntime} from '@loaders.gl/wms';

const runtime = new ServiceRuntime({
  headers: {Authorization: `Bearer ${token}`},
  retries: 3,
  onTelemetry: event => console.log(event.phase, event.url)
});

const source = runtime.getSource('https://example.com/arcgis/rest/services/World/MapServer');
const metadata = await source.getMetadata();
```

Applications can supply a custom `loaders` list to control supported protocols while keeping the
same lifecycle and error behavior.
