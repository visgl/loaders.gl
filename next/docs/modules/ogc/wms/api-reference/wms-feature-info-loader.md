WMS API · feature information

![](/next/images/format-logos/ogc-mark.svg)OGCWMS

# Ask a map service what is under the cursor.

WMSFeatureInfoLoader parses the XML response from a GetFeatureInfo request into a typed JavaScript result. It keeps verbose protocol details behind a smaller boundary for identify, tooltip, and inspection tools.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[WMS format](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/wms.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The identify path

## Keep map rendering and feature inspection separate.

The WMS map response is an image; GetFeatureInfo is a separate request that returns information about the queried location. This loader parses that second response without becoming a full XML client.

01

Input

XML response from a WMS GetFeatureInfo request

02

Output

Typed WMSFeatureInfo data

03

Runtime

Synchronous XML parsing; no worker path

04

Fallback

Use XMLLoader when fields outside the normalized result are needed

Detailed guide

## WMSFeatureInfoLoader reference

The sections below document request usage, parsed data, options, and the boundary between normalized fields and raw XML.

![From-v3.3](https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `WMSFeatureInfoLoader` parses the XML-formatted response from the [OGC](https://www.opengeospatial.org/) [WMS](https://www.ogc.org/standards/wms) (Web Map Service) standard `GetFeatureInfo` request into a typed JavaScript data structure.

> Note that the WMS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If this is a problem, it is possible to use the `XMLLoader` directly though the result will be untyped and not normalized.

| WMSFeatureInfoLoader |                                                      |
| -------------------- | ---------------------------------------------------- |
| File Extension       | `.xml`                                               |
| File Type            | Text                                                 |
| File Format          | [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format          | Data structure                                       |
| Decoder Type         | Synchronous                                          |
| Worker Thread        | ❌ No                                                |
| Streaming Support    | ❌ No                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {_WMSFeatureInfoLoader, type _WMSFeatureInfo} from '@loaders.gl/ogc/wms';

import {load} from '@loaders.gl/core';



// Form a WMS request

const url = `${WMS_SERVICE_URL}?REQUEST=GetFeatureInfo&LAYER=...`;



const data = (await load(url, _WMSFeatureInfoLoader, options)) as _WMSFeatureInfo;
```

## Parsed Data Format[​](#parsed-data-format "Direct link to Parsed Data Format")

```
/** All capabilities of a WMS service. Typed data structure extracted from XML */

export type WMSFeatureInfo = {

  features: {

    attributes: Record<string, number | string>;

    type: string;

    bounds: {top: number; bottom: number; left: number; right: number};

  }[];

};
```

The current experimental parser extracts `FIELDS` attributes from `FeatureInfoResponse`. Its `type` and `bounds` fields are placeholders (empty string and zero bounds), not inferred feature geometry. Other response encodings need a matching parser. The public export is `_WMSFeatureInfoLoader`.

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
