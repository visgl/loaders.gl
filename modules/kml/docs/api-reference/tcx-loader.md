# TCXLoader

The `TCXLoader` parses [TCX files][tcx_wikipedia] into GeoJSON.

| Loader                | Characteristic                             |
| --------------------- | ------------------------------------------ |
| File Extension        | `.tcx`                                     |
| File Type             | Text                                       |
| File Format           | [TCX][tcx_wikipedia]                       |
| Data Format           | [GIS](docs/specifications/category-gis.md) |
| Decoder Type          | Synchronous                                |
| Worker Thread Support | No                                         |
| Streaming Support     | No                                         |

[tcx_wikipedia]: https://en.wikipedia.org/wiki/Training_Center_XML

## Usage

```js
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
