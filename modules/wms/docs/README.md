# Overview

The `@loaders.gl/wms` module handles the  [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) (Web Map Service) standard. WMS was standardized in 1999 as a way to serve geo-referenced web map images over the internet.

## WMS Format Overview

### Requests

WMS specifies HTTP request types that a compatible web map server should support. Only `GetCapabilities` and `GetMap` are required.

| **Request** | **Optional** | **Description** |
| --- | --- | --- |
| `GetCapabilities` | N | Returns parameters about the WMS (such as map image format and WMS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `GetMap` | N | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format |
| `GetFeatureInfo` | Y | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image. |
| `DescribeLayer` | returns the feature types of the specified layer or layers, which can be further described using WFS or WCS requests. This request is dependent on the Styled Layer Descriptor (SLD) Profile of WMS.[12] |
| `GetLegendGraphic` | N | return an image of the map's legend image, giving a visual guide to map elements.
All communication is served through HTTP. |

## Map image

A WMS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG, etc. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format.

## Installation

```bash
npm install @loaders.gl/wms
npm install @loaders.gl/core
```

## Attribution

...