# WMSCapabilityLoader

Implements part of the [OGC](https://www.opengeospatial.org/) standard.

The `WMSCapabilitiesLoader` parses XML-encoded capability data for the [WMS](https://www.ogc.org/standards/wms) (Web Map Service) standard.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.xml`                                               |
| File Type             | Text                                                 |
| File Format           | [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure         |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | Yes                                                  |
| Streaming Support     | No                                                   |

## Usage

```js
import {WMSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const data = await load(url, WMSCapabilitiesLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
