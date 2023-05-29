# GMLLoader

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `GMLLoader` parses the XML-formatted response from the 
the [OGC](https://www.opengeospatial.org/)-standardized [GML](https://www.ogc.org/standards/wms) (Geographic Markup Language) file format into a standard geospatial feature table.

> Note that the GML standard is very ambitious and full support of the format is out of scope.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.gml`                                               |
| File Type             | Text                                                 |
| File Format           | [GML](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure         |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | Yes                                                  |
| Streaming Support     | No                                                   |

## Usage

```js
import {GMLLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a GML request
const url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;

const data = await load(url, GMLLoader, options);
```

## Parsed Data Format

The `GMLLoader` only supports parsing the standard geospatial subset of features (points, multipoints, lines, linestrings, polygons and multipolygons), on a "best effort" basis. Because of this, the `GMLLoader` is treated as a geospatial loader and can return GeoJSON style output.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
