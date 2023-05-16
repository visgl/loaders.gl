# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

![ogc-logo](../../images/logos/ogc-logo-60.png)

# OGC Web Services

The `@loaders.gl/wms` module provides support for a subset of the OGC Web Services which are a set of XML-based web mapping standards.

> The Open Geospatial Consortium (OGC) has produced a large set of related XML-based standards for web mapping. Some of these standards are not supported by loaders.gl, but are still mentioned here to provide context for the provided functionality (and minimize confusion as the standards have similar names and functionalities):

## Services

| OGC Protocol/Format                                                    | Supported    | Description                                                                                                                          |
| ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**CSW**](/docs/modules/wms/formats/csw) (Catalog Service for the Web) protocol     | Y            | protocol for reading a catalog of geospatial assets and services from a URL.                                                         |
| [**WMS**](/docs/modules/wms/formats/wms) (Web Map Service) protocol                 | Y            | protocol for serving geo-referenced map images over the internet.                                                                    |
| [**WFS**](/docs/modules/wms/formats/wfs) (Web Feature Service) protocol             | experimental | protocol for serving geo-referenced map features (geometries) over the internet.                                                     |
| [**WMTS**](/docs/modules/wms/formats/wmts) (Web Map Tile Service) protocol          | experimental | protocol for serving pre-rendered or run-time computed georeferenced map tiles over the Internet.                                    |
| [**GML**](/docs/modules/wms/formats/gml) (Geographic Markup Language) format        | experimental | an XML grammar that describes geographical features.                                                                                 |
| [**WCS**](/docs/modules/wms/formats/wcs) (Web Coverage Service)                     | N            | Load coverage data (e.g. geotiff images for satellite data) from a server.                                                           |
| [**WMC**](/docs/modules/wms/formats/wmc) (Web Map Context)                          | No           | Used in WMS clients to save the configuration of maps and to load them again later. Can also be exchanged between different clients. |
| [**OWS Context**](/docs/modules/wms/formats/ows-context) (OGC Web Services Context) | No           | Allows configured information resources to be passed between applications primarily as a collection of services.                     |

## API

Support for the protocols is provided in the form of:

- [`WMSService`][capabilities_loader].
- [`WMSCapabilitiesLoader`][capabilities_loader].

- a small collection of parsers for the XML responses from the various requests in these protocols.
- a short write-up on each protocol to indicate how to use loaders.gl to parse responses

Support for the GML format is provided as

- A standard "geospatial category" loader that converts the data into GeoJSON format.

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
