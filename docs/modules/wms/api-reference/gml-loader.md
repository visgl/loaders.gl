# GMLLoader

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `GMLLoader` parses the XML-formatted response from the
the [OGC](https://www.opengeospatial.org/)-standardized [GML](https://www.ogc.org/standards/wms) (Geographic Markup Language) file format into a standard geospatial feature table.

> Note that the GML standard is very ambitious and full support of the format is out of scope.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.gml`                                               |
| File Type             | Text                                                 |
| File Format           | [GML](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure                                       |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | Yes                                                  |
| Streaming Support     | No                                                   |

## Usage

```typescript
import {GMLLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a GML request
const url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;

const data = await load(url, GMLLoader, options);
```

## Parsed Data Format

The `GMLLoader` supports the standard geospatial subset of geometries (points, multipoints, lines, linestrings, polygons and multipolygons), and GML `FeatureCollection` documents are returned as GeoJSON-style feature collections with feature IDs and properties.

For large WFS responses, the parser-bearing loader also supports incremental feature batches:

```typescript
import {GMLLoader} from '@loaders.gl/wms/bundled';

for await (const batch of GMLLoader.parseInBatches!(response.body as any, {
  gml: {batchSize: 500}
})) {
  renderFeatures(batch.features);
}
```

The streaming path emits complete `featureMember` elements as soon as they are available and keeps
the final incomplete fragment buffered until the response ends.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
