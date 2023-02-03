# WMS Overview

[WMS](https://en.wikipedia.org/wiki/Web_Map_Service) (Web Map Service) is a standardized protocol for serving geo-referenced **map images** over the internet. 

WMS was standardized in 1999 as a way to serve map images over the web.

## Characteristics

WMS is not a file format but rather a protocol, specifying a set of requests that the server should implement. Some WMS protocol requests return binary images, and some return metadata formatted as XML text responses. 

The XML responses have a fairly detailed structure and some variations exists, so when working with WMS it is typically useful to have access to well-tested parsers for each XML response type.

## Request Types

The WMS standard specifies a number of "request types" that a standards-compliant WMS server should support. loaders.gl provides loaders for all WMS request responses: 

| **WMS Request**        | **Response Loader**         | **Description**                                                                                                                                                                                                                    |
| ------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GetCapabilities`  | `WMSCapabilitiesLoader`     | Returns WMS metadata (such as map image format and WMS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `GetMap`           | `ImageLoader`               | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format                                                                                                   |
| `GetFeatureInfo`   | `WMSFeatureInfoLoader`      | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image.                                                                                                                                 |
| `DescribeLayer`    | `WMSLayerDescriptionLoader` | gets feature types of the specified layer or layers, which can be further described using WFS or WCS requests. This request is dependent on the Styled Layer Descriptor (SLD) Profile of WMS.                                      |
| `GetLegendGraphic` | `ImageLoader`               | An image of the map's legend, giving a visual guide to map elements.                                                                                                                                                               |
| Exceptions | `WMSErrorLoader` | Parses an XML encoded WMS error response from any malformed request. |

> Note that only the `GetCapabilities` and `GetMap` request types are are required to be supported by a WMS server. Information about which request types are supported is available in the response to `GetCapabilities` request.

## Map images

A WMS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format. The MIME types of the `GetMap` request can be inspected in the response to the `GetCapabilities` request.

### Layers

A WMS service defines a number of layers organized in layer groups. If no layers are requested, no map image will be generated.

> Note that the GetCapabilities request can always be used to discover layer names, however on public servers the `GetCapabilities` request is often quite slow, so it can take a long time to auto-discover a layer name and then request a map with that layer. The good news is that the `GetMap` request is usually faster once you have a list of valid layer names. 

## Servers

GeoServer is a major open source server with support for serving WMS images.

### Vendor parameters

A specific server implementation often supports additional vendor specific parameters, e.g [GeoServer](https://docs.geoserver.org/2.22.x/en/user/services/wms/vendor.html#wms-vendor-parameters)




