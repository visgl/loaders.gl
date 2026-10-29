Service metadata

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# Inspect different services through one small capability shape.

The WMS module preserves each service’s native response while exposing common identity, layers, coordinate systems, formats, and operations for applications that should not branch immediately on protocol.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[WMS source](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wms-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wms-source-loader.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The capabilities boundary

## Parse native metadata. Normalize what applications actually need.

Protocol-specific details remain available under \`formatSpecificMetadata\`; the normalized shape is for shared discovery and UI logic, not a replacement for every service feature.

01

Native input

WMS, WMTS, WFS, or ArcGIS capabilities

02

Normalize

Identity, layers, CRS, formats, and operations

03

Preserve

Format-specific metadata and service details

04

Use

Choose a source request without protocol-shaped UI code

The WMS module exposes a protocol-neutral `ServiceCapabilities` shape for applications that need to inspect WMS, WMTS, WFS, and ArcGIS services without branching on every service's native metadata model.

Detailed guide

## Normalized capabilities details

The reference below covers the common shape, native metadata preservation, supported normalizers, and where protocol-specific APIs remain necessary.

```
import {normalizeWMTSCapabilities} from '@loaders.gl/ogc/wms';



const capabilities = normalizeWMTSCapabilities(wmtsCapabilities, serviceUrl);

console.log(capabilities.layers, capabilities.crs, capabilities.formats);
```

The normalizers preserve the native response under `formatSpecificMetadata` while exposing common service identity, layers, coordinate systems, formats, and operations.
