# WFS Overview

[WFS](https://en.wikipedia.org/wiki/Web_Feature_Service) (Web Feature Service) is a standardized protocol for serving geographical *features** over the internet.

WFS was standardized in 1999 as a way to .

## Characteristics

WFS is not a single file format but rather a protocol, specifying a number of required and optional requests. Some requests return binary images, and some return metadata formatted as XML (text) responses. The XML responses are fairly detailed and some variations exists, so when working with WFS it is typically useful to have access to pre-tested parsers for each response type.

## Profiles

- Basic WFS (`WFS-Basic`) - A READ-ONLY WFS. Unable to service transaction requests necessary for data manipulation
- Transaction WFS (`WFS-T`) - Supports all the operations of basic WFS including the ability to manipulate the data (create, edit, delete, and update features).

## Request Types

The WFS standard specifies a number of "request types" that a standards-compliant WFS server should support. loaders.gl provides loaders for all WFS request responses:

| **WFS Request**       | **Response Loader**         | **Description**                                                                                                                                                                                                                    |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic WFS
| `GetCapabilities`     | `WFSCapabilitiesLoader`     | Returns parameters about the WFS (such as map image format and WFS version compatibility) and the available layers (map bounding box, coordinate reference systems, URI of the data and whether the layer is mostly opaque or not) |
| `DescribeFeatureType` | `WFSFeatureTypeLoader`      | if a layer is marked as 'queryable' then you can request data about a coordinate of the map image.                                                                                                                                 |
| `GetFeature`          | `WFSFeatureLoader`               | returns a map image. Parameters include: width and height of the map, coordinate reference system, rendering style, image format                                                                                                   |
| Transaction WFS
| `Transaction`       | Not yet supported | Enables data manipulation (editing) of features via CRUD operations.                                      |
| `LockFeature`    | Not yet supported              | A lock request on one or more instances of a feature type elements.                                                                                                                                                               |

Note that the response to `GetCapabilities` contains information about which request types are supported

## Features

A WFS server usually serves the map in a bitmap format, e.g. PNG, GIF, JPEG. In addition, vector graphics can be included, such as points, lines, curves and text, expressed in SVG or WebCGM format. The MIME types of the `GetMap` request can be inspected in the response to the `GetCapabilities` request.
