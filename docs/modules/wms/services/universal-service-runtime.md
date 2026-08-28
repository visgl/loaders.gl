# Universal service runtime

`ServiceRuntime` is an optional lifecycle wrapper for the OGC sources in `@loaders.gl/wms`. It
selects a loader, caches the resulting source, and applies consistent request policy without hiding
the source's protocol-specific methods.

## Feature support

| Capability | Support | Behavior |
| --- | --- | --- |
| Service loader selection | Supported | Uses URL detection or an explicit loader list |
| Source instance cache | Supported | Repeated URLs reuse the resolved source |
| Shared headers | Supported | Applied to runtime requests |
| Retries | Supported | Configurable retry count around transient failures |
| Cancellation | Supported | Abort signals propagate to requests |
| Telemetry | Supported | Emits request phase, URL, timing, and error events |
| Consistent errors | Supported | `ServiceRequestError` carries operation and request context |
| Custom loaders | Supported | Supply a narrowed or extended loader list |
| ArcGIS loaders | Injectable | ArcGIS sources live in `@loaders.gl/services`, not the default OGC registry |
| Persistent HTTP cache | Not provided | Integrate through the fetch layer or application cache |

## Usage

```ts
import {ServiceRuntime} from '@loaders.gl/wms';

const runtime = new ServiceRuntime({
  headers: {Authorization: `Bearer ${token}`},
  retries: 3,
  onTelemetry: event => console.log(event.phase, event.url)
});

const source = runtime.getSource('https://example.com/geoserver/wms');
const metadata = await source.getMetadata();
```

The default registry includes WMS, WMTS, WFS, WCS, CSW, OGC API Features, Tiles, Coverages, and
EDR. Applications can supply `loaders` to reduce bundle scope or inject additional source loaders.

## When to use it

Use `ServiceRuntime` when an application needs a uniform operational policy across many dynamic
service endpoints. Use `createDataSource()` directly when the endpoint and protocol are known and
the extra lifecycle policy is unnecessary.
