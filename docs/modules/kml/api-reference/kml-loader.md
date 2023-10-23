# KMLLoader

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `KMLLoader` parses [KML files][kml_wikipedia] into GeoJSON. From Wikipedia:

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.kml`                                     |
| File Type             | Text                                       |
| File Format           | [KML][kml_wikipedia]                       |
| Data Format           | [GIS](/docs/specifications/category-gis) |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | No                                         |
| Streaming Support     | No                                         |

[kml_wikipedia]: https://en.wikipedia.org/wiki/Keyhole_Markup_Language

## Usage

```typescript
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
