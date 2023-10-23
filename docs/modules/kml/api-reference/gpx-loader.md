# GPXLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `GPXLoader` parses [GPX files][gpx_wikipedia] into GeoJSON. From Wikipedia:


| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.gpx`                                     |
| File Type             | Text                                       |
| File Format           | [GPX][gpx_wikipedia]                       |
| Data Format           | [GIS](/docs/specifications/category-gis) |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | No                                         |
| Streaming Support     | No                                         |

[gpx_wikipedia]: https://en.wikipedia.org/wiki/GPS_Exchange_Format

## Usage

```typescript
import {GPXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, GPXLoader, options);
```

## Options

| Option       | Type   | Default     | Description                                       |
| ------------ | ------ | ----------- | ------------------------------------------------- |
| `gis.format` | string | `'geojson'` | Can be set to `'raw'`, `'geojson'` or `'binary'`. |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
