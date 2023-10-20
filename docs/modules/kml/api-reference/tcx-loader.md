# TCXLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `TCXLoader` parses [TCX files][tcx_wikipedia] into GeoJSON. From Wikipedia:

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.tcx`                                     |
| File Type             | Text                                       |
| File Format           | [TCX][tcx_wikipedia]                       |
| Data Format           | [GIS](/docs/specifications/category-gis) |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | No                                         |
| Streaming Support     | No                                         |

[tcx_wikipedia]: https://en.wikipedia.org/wiki/Training_Center_XML

## Usage

```typescript
import {TCXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, TCXLoader, options);
```

## Options

| Option       | Type   | Default     | Description                                       |
| ------------ | ------ | ----------- | ------------------------------------------------- |
| `gis.format` | string | `'geojson'` | Can be set to `'raw'`, `'geojson'` or `'binary'`. |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
