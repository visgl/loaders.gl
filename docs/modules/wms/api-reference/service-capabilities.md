---
title: Service capabilities
description: Normalize native service metadata into one protocol-neutral capabilities shape.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Service metadata"
  title="Inspect different services through one small capability shape."
  description="The WMS module preserves each service’s native response while exposing common identity, layers, coordinate systems, formats, and operations for applications that should not branch immediately on protocol."
  tone="mint"
  meta={['WMS', 'WMTS', 'WFS', 'ArcGIS']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WMS source', to: '/docs/modules/wms/api-reference/wms-source-loader'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The capabilities boundary"
  title="Parse native metadata. Normalize what applications actually need."
  description="Protocol-specific details remain available under `formatSpecificMetadata`; the normalized shape is for shared discovery and UI logic, not a replacement for every service feature."
  tone="mint"
  items={[
    {label: 'Native input', value: 'WMS, WMTS, WFS, or ArcGIS capabilities'},
    {label: 'Normalize', value: 'Identity, layers, CRS, formats, and operations'},
    {label: 'Preserve', value: 'Format-specific metadata and service details'},
    {label: 'Use', value: 'Choose a source request without protocol-shaped UI code'}
  ]}
/>

The WMS module exposes a protocol-neutral `ServiceCapabilities` shape for applications that need
to inspect WMS, WMTS, WFS, and ArcGIS services without branching on every service's native metadata
model.

<ReferenceBoundary
  title="Normalized capabilities details"
  description="The reference below covers the common shape, native metadata preservation, supported normalizers, and where protocol-specific APIs remain necessary."
  tone="mint"
/>

```typescript
import {normalizeWMTSCapabilities} from '@loaders.gl/wms';

const capabilities = normalizeWMTSCapabilities(wmtsCapabilities, serviceUrl);
console.log(capabilities.layers, capabilities.crs, capabilities.formats);
```

The normalizers preserve the native response under `formatSpecificMetadata` while exposing common
service identity, layers, coordinate systems, formats, and operations.
