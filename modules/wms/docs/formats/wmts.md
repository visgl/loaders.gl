# WMTS Overview

The [WMTS](https://en.wikipedia.org/wiki/Web_Map_Tile_Service) (Web Map Tile Service) is a standardized protocol for serving pre-rendered or run-time computed georeferenced **map tiles** over the Internet. 

The specification was developed and first published by the Open Geospatial Consortium in 2010.

## Characteristics

WMTS is not a single file format but rather a protocol, specifying a number of required and optional requests. Some requests return binary images, and some return metadata formatted as XML (text) responses. The XML responses are fairly detailed and some variations exists, so when working with WMTS it is typically useful to have access to pre-tested parsers for each response type.

## Request Types

The WMTS standard specifies a number of "request types" that a standards-compliant WMTS server should support. loaders.gl provides loaders for all WMTS request responses: 

| **WMTS Request**        | **Response Loader**         | **Description**                                                                                                                                                                                                                    |
| ------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GetCapabilities`  | `WMTSCapabilitiesLoader`     | Returns parameters about the WMTS (such as map image format and WMTS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `GetMap`           | `ImageLoader`               | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format                                                                                                   |
| `GetFeatureInfo`   | `WMTSFeatureInfoLoader`      | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image.                                                                                                                                 |
| `DescribeLayer`    | `WMTSLayerDescriptionLoader` | gets feature types of the specified layer or layers, which can be further described using WFS or WCS requests. This request is dependent on the Styled Layer Descriptor (SLD) Profile of WMTS.                                      |
| `GetLegendGraphic` | `ImageLoader`               | An image of the map's legend, giving a visual guide to map elements.                                                                                                                                                               |
Note that only the `GetCapabilities` and `GetMap` request types are are required to be supported by a WMTS server. The response to `GetCapabilities` contains information about which request types are supported

## Map images

A WMTS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format. The MIME types of the `GetMap` request can be inspected in the response to the `GetCapabilities` request.
