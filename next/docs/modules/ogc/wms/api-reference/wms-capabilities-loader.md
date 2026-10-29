WMS module · capabilities loader

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# WMSCapabilitiesLoader

Read an OGC Web Map Service capabilities response into typed metadata describing layers, requests, limits, exceptions, and supported service behavior.

[WMS format](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[CRS and tile grids](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/crs-and-tile-grids.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/crs-and-tile-grids.md)

What it reads

## Inspect a map service before making map requests.

GetCapabilities is the service’s catalog. The loader turns its XML response into metadata applications can use to select layers, formats, coordinate systems, and request methods.

01

Layers

Names, titles, bounds, and nested groups

02

Requests

Supported WMS operations and formats

03

Service

Limits, fees, access, and keywords

04

Exceptions

Declared error formats and behavior

Detailed guide

## WMSCapabilitiesLoader reference

The sections below document the request, parsed capability types, options, and XML limitations.

![From-3.3](https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `WMSCapabilitiesLoader` parses the XML-formatted response from the the [OGC](https://www.opengeospatial.org/) [WMS](https://www.ogc.org/standards/wms) (Web Map Service) standard `GetCapabilities` request into a strongly typed JavaScript data structure.

| WMSCapabilitiesLoader |                                                      |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.xml`                                               |
| File Type             | Text                                                 |
| File Format           | [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure                                       |
| Decoder Type          | Synchronous                                          |
| Worker Thread         | ✅ Yes                                               |
| Streaming Support     | ❌ No                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {WMSCapabilitiesLoader} from '@loaders.gl/ogc/wms';

import {load} from '@loaders.gl/core';



// Form a WMS request

const url = `${WMS_SERVICE_URL}?REQUEST=GetCapabilities`;



const data = await load(url, WMSCapabilitiesLoader, options);
```

## Parsed Data Format[​](#parsed-data-format "Direct link to Parsed Data Format")

```
/** All capabilities of a WMS service - response to a WMS `GetCapabilities` data structure extracted from XML */

export type WMSCapabilities = {

  /** Version of the WMS service */

  version?: string; // '1.3.0' | '1.1.1' | '1.1.0' | '1.0.0'

  /** A short name for the service */

  name: string;

  /** A human readable name for the service */

  title?: string;

  /** A more extensive description of the service */

  abstract?: string;

  /** A set of keywords e.g. for searching services */

  keywords: string[];

  /** A field of unspecified format, if present describes any access constraints required to use the service. */

  accessConstraints?: string;

  /** A field of unspecified format, if present describes any fees associated with the use of the service */

  fees?: string;

  /** If present, the max number of layers that can be rendered by the service */

  layerLimit?: number;

  /** If present, the widest image that can be rendered by the service */

  maxWidth?: number;

  /** If present, the tallest image that can be rendered by the service */

  maxHeight?: number;

  /** Hierarchical list of layers. */

  layers: WMSLayer[];

  /** A map with information about supported WMS requests. If a record is present, the request is supported by the service */

  requests: Record<string, WMSRequest>;

  /** Information about any exceptions that the service will report (HTTP status != 2xx) */

  exceptions?: WMSExceptions;

  /** Only if `options.raw`: raw untyped JSON parsed from XML. Can include information not extracted in the typed response. */

  raw?: Record<string, unknown>;

  /** Only if `options.xml`, the unparsed XML string can be requested */

  xml?: string;

};



/**

 * Metadata about a layer

 * Layers inherit many properties from their parent layers, see description of individual props for details.

 * @see https://www.ogc.org/standard/wms/ 7.2.4.6

 */

export type WMSLayer = {

  /** The title is a human readable name. It is mandatory on each layer. Not inherited.  */

  title: string;

  /** A layer is renderable if it has a name. A named parent layer will render all its sublayers. Not inherited. */

  name?: string;

  /** A narrative description of the map layer. */

  abstract?: string;

  /** A set of keywords e.g. for searching layers */

  keywords: string[];

  /** layer limits in unspecified CRS:84-like lng/lat, for quick access w/o CRS calculations.  Defined or inherited. */

  geographicBoundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];

  /** Supported CRS. Either defined or inherited. */

  crs?: string[];

  /** Bounding boxes in specific CRS:es */

  boundingBoxes?: WMSBoundingBox[];



  dimensions?: WMSDimension[]; // ?? 7.2.4.6.10



  // minScale: number;

  // maxScale: number;

  // MetadataURL

  // Attribution

  // Identifier and AuthorityURL

  // FeatureListURL

  // DataURL



  /** Whether queries can be performed on the layer */

  queryable?: boolean;

  /** `false` if layer has significant no-data areas that the client can display as transparent. */

  opaque?: boolean;

  /** WMS cascading allows server to expose layers coming from other WMS servers as if they were local layers */

  cascaded?: boolean;

  // noSubsets: boolean

  // fixedWith: number

  // fixedHeight: number



  /** A list of styles. @note not yet supported by WMSCapabilitiesLoader */

  styles?: unknown[];



  /** Sublayers - these inherit crs and boundingBox) if not overridden) */

  layers: WMSLayer[];

};



/**

 * A bounding box specifies the coordinate range for data in the layer.

 * No data is available outside the bounding box.

 */

export type WMSBoundingBox = {

  /** CRS indicates the Layer CRS that applies to this bounding box. */

  crs: string;

  /** `[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS. */

  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];

  /** Spatial horizontal resolution of data in same units as bounding box */

  xResolution?: number;

  /** Spatial vertical resolution of data in same units as bounding box */

  yResolution?: number;

};



/** Metadata about a supported WMS request  */

export type WMSRequest = {

  /** MIMEtypes that can be returned by this request. */

  mimeTypes: string[];

};



export type WMSExceptions = {

  /** MIME types for exception response payloads. */

  mimeTypes: string[];

};



export type parseWMSCapabilitiesOptions = {

  /** Add inherited layer information to sub layers */

  inheritedLayerProps?: boolean;

  /** Include the "raw" JSON (parsed but untyped, unprocessed XML). May contain additional fields */

  includeRawData?: boolean;

  /** Include the original XML document text. May contain additional information. */

  includeXMLText?: boolean;

  /** @deprecated Use includeRawData` */

  raw?: boolean;



  // xml options are passed through to xml loader

};
```

## Options[​](#options "Direct link to Options")

| Option                     | Type      | Default | Description                                                                                 |
| -------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------- |
| `wms.inheritedLayerProps?` | `boolean` | `false` | Adds inherited layer information from parent layers to sub layers                           |
| `wms.includeRawData?`      | `boolean` | `false` | Include the "raw" JSON (parsed but untyped, unprocessed XML). May contain additional fields |
| `wms.includeXMLText?`      | `boolean` | `false` | Include the original XML document text. May contain additional information.                 |

## Limitations[​](#limitations "Direct link to Limitations")

Note that the WMS standard is rather verbose and the XML responses contain some rarely used metadata fields and possibly some vendor specific fields, not all of which are extracted by this loader. If this is a problem, it is possible to inspect the output of the `XMLLoader`, by setting the `raw` option.
