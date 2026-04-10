# WMSLayerDescriptionLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `WMSLayerDescriptionLoader` parses the XML-formatted response from the 
the [OGC](https://www.opengeospatial.org/) [WMS](https://www.ogc.org/standards/wms) (Web Map Service) standard `DescribeLayer` request into a typed JavaScript data structure.

> Note that the WMS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If this is a problem, it is possible to use the `XMLLoader` directly though the result will be untyped and not normalized.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.xml`                                               |
| File Type             | Text                                                 |
| File Format           | [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure         |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | No                                                  |
| Streaming Support     | No                                                   |

## Usage

```js
import {WMSLayerDescriptionLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a WMS request
const url = `${WMS_SERVICE_URL}?REQUEST=DescribeLayer&LAYER=...`;

const data = await load(url, WMSLayerDescriptionLoader, options);
```

## Parsed Data Format

```typescript
/** All capabilities of a WMS service. Typed data structure extracted from XML */
export type WMSLayerDescription = {
  // TO BE DOCUMENTED
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
