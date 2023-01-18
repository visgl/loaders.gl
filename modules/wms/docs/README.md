# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

# Supported Standards

The `@loaders.gl/wms` module provides support for a subset of the OGC-standardized XML-based web mapping standards.

> The Open Geospatial Consortium (OGC) has produced a large set of related XML-based standards for web mapping. Some of these standards are not supported by loaders.gl, but are still mentioned here to provide context for the provided functionality (and minimize confusion as the standards have similar names and functionalities):

| OGC Protocol/Format | Supported | Description |
| --- | --- | --- |
| [**WMS**](./formats/wms.md) (Web Map Service) protocol | Y | protocol for serving geo-referenced map images over the internet. |
| [**WFS**](./formats/wfs.md) (Web Feature Service) protocol | experimental | protocol for serving geo-referenced map features (geometries) over the internet. |
| [**WMTS**](./formats/wmts.md) (Web Map Tile Service) protocol | experimental | protocol for serving pre-rendered or run-time computed georeferenced map tiles over the Internet. |
| [**GML**](./formats/gml.md) (Geographic Markup Language) format |  experimental | an XML grammar that describes geographical features. |
| [**WCS**](./formats/wcs.md) (Web Coverage Service) | N | Load coverage data (e.g. geotiff images for satellite data) from a server. |
| [**WMC**](./formats/wmc.md) (Web Map Context) | No | WMC is used in WMS clients to save the configuration of the currently displayed maps and to load them again later. Depending on the application, the files can also be exchanged between different clients. URL and other information, for example on the individual layers of the map, are stored in the WMC documents |
| [**OWS Context**](./formats/ows-context.md) (OGC Web Services Context) | No | Allows configured information resources (service set) to be passed between applications primarily as a collection of services. Supports in-line content as well. |

Support for the protocols is provided in the form of:
- a small collection of parsers for the XML responses from the various requests in these protocols.
- a short write-up on each protocol to indicate how to use loaders.gl to parse responses

Support for the GML format is provided as
- A standard "geospatial category" loader that converts the data into GeoJSON format.

## Related Standards

| OGC Protocol/Format | Description |
| --- | --- |

## Installation

```bash
npm install @loaders.gl/wms
npm install @loaders.gl/core
```

## Attributions

`@loaders.gl/wms` relies heavily on `@loaders.gl/xml` to parse the XML heavy OGC standards.

Some test cases are forked from open layers, see license in test directory, 
however no openlayers code is included in the published module, in order to 
avoid downstream "binary attribution" requirements on loaders.gl users.

