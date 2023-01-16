# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

The `@loaders.gl/wms` module provides support for a group of related OGC-standardized web mapping standards:

- [**WMS**](./formats/wms) (Web Map Service) protocol. 
- [**WFS**](./formats/wfs) (Web Feature Service) protocol. 
- [**WMTS**](./formats/wmts) (Web Map Tile Service) protocol.
- [**GML**](./formats/gml) (Geographic Markup Language). 

Support for the protocols is provided in the form of:
- a complement of parsers for the XML responses to the various requests in these protocols.
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

