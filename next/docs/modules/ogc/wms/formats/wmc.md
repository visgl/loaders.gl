OGC context format

[![](/next/images/format-logos/ogc-mark.svg)OGCWMC](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmc.md)

# Know where WMC ends and service loading begins.

Web Map Context packages a configured set of map layers. loaders.gl preserves this page as a format reference while the active implementation boundary remains XML parsing plus the WMS source APIs.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[WMS source](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

| Type | API                                                                                                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | WMC documents have no dedicated loader. Use [WMSSourceLoader](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wms-source-loader.md) to load each referenced WMS service. |

Implementation boundary

## Read the context, then load the referenced service.

A WMC document is configuration and references, not the map pixels themselves. Use XML parsing for the document and a service source for each referenced WMS endpoint.

01

Document

Configured layers and service references

02

Parsing

@loaders.gl/documents for legacy documents

03

Map data

WMSSourceLoader for referenced services

04

Status

No dedicated WMC loader in v5

[![](/next/images/format-logos/ogc-mark.svg)OGCWMC](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmc.md)[WMC](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmc.md)

Web Map Context is a legacy OGC document format for saving and exchanging a configured set of map layers.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability              | Support                 | Recommendation                                                              |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------- |
| WMC document parsing    | ❌ Not implemented      | Parse XML with `@loaders.gl/documents` when maintaining legacy applications |
| WMC document writing    | ❌ Not implemented      | Keep application state in a modern JSON configuration                       |
| Referenced WMS layers   | ✅ Supported separately | Use `WMSSourceLoader` for each referenced service                           |
| Modern context exchange | ❌ Not implemented      | OWS Context is documented separately but also has no dedicated loader       |

Detailed guide

## WMC format details

The support matrix below distinguishes the context document from the WMS services it references.

This page is retained so users can distinguish WMC from WMS. loaders.gl v5 supports the referenced WMS services, not the context document itself.

## References[​](#references "Direct link to References")

* [OGC Web Map Context specification](https://www.ogc.org/standard/wmc/)
