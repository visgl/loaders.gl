# WMTSCapabilityLoader

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `WMTSCapabilitiesLoader` parses the XML-formatted response from the 
the [OGC](https://www.opengeospatial.org/) [WMTS](https://www.ogc.org/standards/wms) (Web Map Tile Service) standard `GetCapabilities` request into a typed JavaScript data structure.

> Note that the WMTS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If full access to the capabilities data is desired, it is possible to use the `XMLLoader` directly.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.xml`                                               |
| File Type             | Text                                                 |
| File Format           | [WMTS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure         |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | Yes                                                  |
| Streaming Support     | No                                                   |

## Usage

```js
import {WMTSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a WMTS request
const url = `${WMTS_SERVICE_URL}?REQUEST=GetCapabilities`;

const data = await load(url, WMTSCapabilitiesLoader, options);
```

## Parsed Data Format

```typescript
/** All capabilities of a WMTS service. Typed data structure extracted from XML */
export type WMTSCapabilities = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layer: WMTSLayer;
  requests: Record<string, WMTSRequest>;
}

type WMTSLayer = {
  name: string;
  title?: string;
  srs?: string[];
  boundingBox?: [number, number, number, number];
  layers?: WMTSLayer[];
}

type WMTSRequest = {
  name: string;
  mimeTypes: string[];
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
