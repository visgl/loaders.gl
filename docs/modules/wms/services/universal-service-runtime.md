---
title: Universal service runtime
description: Apply shared request policy and source caching across protocol-specific OGC service loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Service operations"
  title="Share operational policy without hiding the protocol."
  description="ServiceRuntime selects a source, reuses it, and applies common headers, retries, cancellation, telemetry, and error context. The resulting source still exposes its protocol-specific methods."
  tone="orange"
  meta={['Source selection', 'Request policy', 'Lifecycle and telemetry']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Capability discovery', to: '/docs/modules/wms/services/capability-discovery'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="Optional runtime layer"
  title="Standardize the boring parts of service access."
  description="Use the runtime when several services need the same transport and lifecycle behavior. Keep direct source APIs when the application needs precise control over one protocol."
  tone="orange"
  items={[
    {label: 'Select', value: 'Detect or explicitly choose a compatible service loader.'},
    {label: 'Reuse', value: 'Cache resolved source instances for repeated URLs.'},
    {label: 'Operate', value: 'Apply headers, retries, abort signals, and telemetry consistently.'},
    {label: 'Explain', value: 'Attach operation and request context to service errors.'}
  ]}
/>

<ReferenceBoundary
  title="ServiceRuntime details"
  description="The reference below covers registry scope, source caching, shared options, custom loaders, telemetry, and the persistent-cache boundary."
  tone="orange"
/>

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
