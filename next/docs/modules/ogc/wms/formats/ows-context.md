OGC context format

![](/next/images/format-logos/ogc-mark.svg)OGCOWS Context

# Treat OWS Context as a resource map, not a data service.

OWS Context packages configured geospatial resources and service links. loaders.gl does not expose a dedicated context loader, but its service sources can load the referenced WMS, WMTS, WFS, and catalog endpoints.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[OGC sources](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)

Implementation boundary

## Use the context to discover; use sources to load.

The context document describes what is available and where. Parse its Atom or JSON representation, then hand each referenced endpoint to the source API that understands that service.

01

Document

Configured geospatial resources and links

02

Encodings

Atom/XML and JSON variants

03

Service APIs

WMS, WMTS, WFS, and catalog sources

04

Status

No dedicated OWS Context loader in v5

Detailed guide

## OWS Context details

The support matrix below clarifies what is represented by the context document and which loaders handle its referenced services.

OWS Context is an OGC exchange format for packaging a collection of configured geospatial resources and services.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                | Support                 | Recommendation                                                           |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| OWS Context Atom encoding | ❌ Not implemented      | Parse the XML with `@loaders.gl/xml` and adapt links in application code |
| OWS Context JSON encoding | ❌ Not implemented      | Load JSON normally and pass referenced endpoints to service loaders      |
| Referenced WMS services   | ✅ Supported separately | Use `WMSSourceLoader`                                                    |
| Referenced WMTS services  | ✅ Supported separately | Use `WMTSSourceLoader`                                                   |
| Referenced WFS services   | ✅ Supported separately | Use `WFSSourceLoader`                                                    |
| General service discovery | ✅ Supported separately | Use `discoverServiceGraph` or a `CSWSourceLoader` catalog                |

This page is retained to clarify the boundary between a context document and the services it can reference. loaders.gl v5 does not expose an OWS Context loader.

## References[​](#references "Direct link to References")

* [OGC OWS Context standard](https://www.ogc.org/standard/owc/)
