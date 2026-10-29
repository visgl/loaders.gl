Service operations

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# Share operational policy without hiding the protocol.

ServiceRuntime selects a source, reuses it, and applies common headers, retries, cancellation, telemetry, and error context. The resulting source still exposes its protocol-specific methods.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[Capability discovery](https://loaders.gl/next/docs/modules/ogc/wms/services/capability-discovery.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/services/capability-discovery.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

Optional runtime layer

## Standardize the boring parts of service access.

Use the runtime when several services need the same transport and lifecycle behavior. Keep direct source APIs when the application needs precise control over one protocol.

01

Select

Detect or explicitly choose a compatible service loader.

02

Reuse

Cache resolved source instances for repeated URLs.

03

Operate

Apply headers, retries, abort signals, and telemetry consistently.

04

Explain

Attach operation and request context to service errors.

Detailed guide

## ServiceRuntime details

The reference below covers registry scope, source caching, shared options, custom loaders, telemetry, and the persistent-cache boundary.

`ServiceRuntime` is an optional lifecycle wrapper for the OGC sources in `@loaders.gl/ogc/wms`. It selects a loader, caches the resulting source, and applies consistent request policy without hiding the source's protocol-specific methods.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability               | Support         | Behavior                                                                  |
| ------------------------ | --------------- | ------------------------------------------------------------------------- |
| Service loader selection | ✅ Supported    | Uses URL detection or an explicit loader list                             |
| Source instance cache    | ✅ Supported    | Repeated URLs reuse the resolved source                                   |
| Shared headers           | ✅ Supported    | Applied to runtime requests                                               |
| Retries                  | ✅ Supported    | Configurable retry count around transient failures                        |
| Cancellation             | ✅ Supported    | Abort signals propagate to requests                                       |
| Telemetry                | ✅ Supported    | Emits request phase, URL, timing, and error events                        |
| Consistent errors        | ✅ Supported    | `ServiceRequestError` carries operation and request context               |
| Custom loaders           | ✅ Supported    | Supply a narrowed or extended loader list                                 |
| ArcGIS loaders           | ✅ Injectable   | ArcGIS sources live in `@loaders.gl/arcgis`, not the default OGC registry |
| Persistent HTTP cache    | ❌ Not provided | Integrate through the fetch layer or application cache                    |

## Usage[​](#usage "Direct link to Usage")

```
import {ServiceRuntime} from '@loaders.gl/ogc/wms';



const runtime = new ServiceRuntime({

  headers: {Authorization: `Bearer ${token}`},

  retries: 3,

  onTelemetry: event => console.log(event.phase, event.url)

});



const source = runtime.getSource('https://example.com/geoserver/wms');

const metadata = await source.getMetadata();
```

The default registry includes WMS, WMTS, WFS, WCS, CSW, OGC API Features, Tiles, Coverages, and EDR. Applications can supply `loaders` to reduce bundle scope or inject additional source loaders.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use `ServiceRuntime` when an application needs a uniform operational policy across many dynamic service endpoints. Use `createDataSource()` directly when the endpoint and protocol are known and the extra lifecycle policy is unnecessary.
