WMS module · capabilities loader

![](/next/images/format-logos/ogc-mark.svg)OGCWMTS

# WMTSCapabilitiesLoader

Read an OGC Web Map Tile Service capabilities response into the layer and request metadata needed to select a tile matrix set and formats.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[CRS and tile grids](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/crs-and-tile-grids.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/crs-and-tile-grids.md)[WMS capabilities](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wms-capabilities-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/wms-capabilities-loader.md)

What it reads

## Turn a verbose tile catalog into selection metadata.

The loader extracts the commonly needed service, layer, request, CRS, and bounding-box fields while leaving the full XML path available through XMLLoader when an application needs more.

01

Layers

Names, titles, bounds, and supported CRS

02

Requests

Operations and advertised MIME types

03

Tile matrix

Metadata for choosing a compatible grid

04

Boundary

Typed subset of a larger XML standard

Detailed guide

## WMTSCapabilitiesLoader reference

The sections below document the request, parsed data, options, and the intentionally focused extraction scope.

![From-3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `WMTSCapabilitiesLoader` parses the XML-formatted response from the the [OGC](https://www.opengeospatial.org/) [WMTS](https://www.ogc.org/standards/wms) (Web Map Tile Service) standard `GetCapabilities` request into a typed JavaScript data structure.

> Note that the WMTS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If full access to the capabilities data is desired, it is possible to use the `XMLLoader` directly.

| WMTSCapabilitiesLoader |                                                       |
| ---------------------- | ----------------------------------------------------- |
| File Extension         | `.xml`                                                |
| File Type              | Text                                                  |
| File Format            | [WMTS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format            | Data structure                                        |
| Decoder Type           | Synchronous                                           |
| Worker Thread          | ✅ Yes                                                |
| Streaming Support      | ❌ No                                                 |

## Usage[​](#usage "Direct link to Usage")

```
import {WMTSCapabilitiesLoader} from '@loaders.gl/ogc/wms';

import {load} from '@loaders.gl/core';



// Form a WMTS request

const url = `${WMTS_SERVICE_URL}?REQUEST=GetCapabilities`;



const data = await load(url, WMTSCapabilitiesLoader, options);
```

## Parsed Data Format[​](#parsed-data-format "Direct link to Parsed Data Format")

The root package exports `WMTSCapabilities`, `WMTSLayer`, `WMTSDimension`, `WMTSTileMatrixSetLink`, `WMTSTileMatrixLimits`, `WMTSTileMatrixSet`, and `WMTSTileMatrix` types. Native metadata is organized under `contents`; the source uses it to select the layer, grid, limits, and dimension defaults.

```
type WMTSCapabilities = {

  serviceIdentification?: {title?: string; abstract?: string; serviceTypeVersion?: string};

  operationsMetadata?: Record<string, unknown>;

  featureInfoUrl?: string | null;

  contents: {layers: WMTSLayer[]; tileMatrixSets: WMTSTileMatrixSet[]};

};
```

| Native field                         | Content                                                                              | Request use                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `contents.layers[].identifier`       | Layer identifier                                                                     | Select by `wmts.layer` or per-request layers                       |
| `featureInfoUrl`                     | Advertised KVP query endpoint, `null` for metadata without a supported query binding | Feature-info endpoint discovery                                    |
| `infoFormats`                        | Optional array of advertised query MIME types                                        | Feature-info format selection and validation                       |
| `formats`, `styles`, `resourceURLs`  | Formats, default styles, tile/feature-info templates                                 | REST/KVP tile configuration and independent feature-info templates |
| `tileMatrixSetLinks[].tileMatrixSet` | Linked matrix set identifier                                                         | Grid/CRS selection                                                 |
| `tileMatrixSetLinks[].limits`        | Optional `WMTSTileMatrixLimits[]`                                                    | Inclusive coverage check before tile fetch                         |
| `dimensions`                         | Optional `WMTSDimension[]`                                                           | Preserve metadata and resolve default values                       |
| `bounds`                             | WGS84 lower/upper corners                                                            | Normalized source extent                                           |
| `contents.tileMatrixSets[].matrices` | Ordered identifiers, scale denominators, origins, tile/matrix sizes                  | Matrix selection and grid metadata                                 |

`WMTSTileMatrixLimits` contains `tileMatrix`, `minimumTileRow`, `maximumTileRow`, `minimumTileColumn`, and `maximumTileColumn`. The parser maps these from XML `MinTileRow`, `MaxTileRow`, `MinTileCol`, and `MaxTileCol`. Indices are nonnegative safe integers and bounds are inclusive. Missing or duplicate identifiers, missing/invalid indices, and reversed bounds are rejected while parsing. Omitted limits differ from an explicitly empty list: omission permits the full matrix, while a list allows only the matrices and ranges it contains. Supplied capabilities receive equivalent bound checks when the source tests coverage.

`WMTSDimension` contains `identifier`, optional `title`, `abstract`, `unitsOfMeasure`, `unitSymbol`, `default`, `current`, and a `values` array. Values/defaults are strings, preserving zero, leading zeros, ISO8601 timestamps, intervals, and reserved keywords. Intervals are not expanded, and current support alone does not select `current`.

See [WMTS coverage and dimension handling](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md#coverage-limits-and-dimensions) for request precedence, synchronous coverage queries, skipped tiles, and remaining rendering limits.

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

`featureInfoUrl` selects an advertised HTTP GET `GetFeatureInfo` binding that permits KVP encoding. Endpoint, operation, and global `GetEncoding` constraints are respected; REST-only bindings are not used as KVP endpoints. If operation metadata is present without a supported query GET binding, this value is `null`. Missing operation metadata leaves it `undefined` for legacy/manual endpoint configuration. See [WMTS feature information](https://loaders.gl/next/docs/modules/ogc/wms/formats/wmts.md#feature-information) for request and response APIs.
