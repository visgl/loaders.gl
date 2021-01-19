# KMLLoader

The `KMLLoader` parses [KML files][kml_wikipedia] into GeoJSON. From Wikipedia:

> Keyhole Markup Language (KML) is an XML notation for expressing geographic
> annotation and visualization within two-dimensional maps and three-dimensional
> Earth browsers.

KML is now an [Open Geospatial Consortium standard][kml_ogc_standard].

[kml_ogc_standard]: https://www.ogc.org/standards/kml

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.kml`                                     |
| File Type             | Text                                       |
| File Format           | [KML][kml_wikipedia]                       |
| Data Format           | [GIS](docs/specifications/category-gis.md) |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | No                                         |
| Streaming Support     | No                                         |

[kml_wikipedia]: https://en.wikipedia.org/wiki/Keyhole_Markup_Language

## Usage

```js
import {KMLLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, KMLLoader, options);
```

## Options

| Option       | Type   | Default     | Description                                       |
| ------------ | ------ | ----------- | ------------------------------------------------- |
| `gis.format` | string | `'geojson'` | Can be set to `'raw'`, `'geojson'` or `'binary'`. |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
