# TCXLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `TCXLoader` parses [TCX files][tcx_wikipedia] into GeoJSON. From Wikipedia:

> Training Center XML (TCX) is a data exchange format introduced in 2007 as part
> of Garmin's Training Center product. The XML is similar to GPX since it
> exchanges GPS tracks, but treats a track as an Activity rather than simply a
> series of GPS points. TCX provides standards for transferring heart rate,
> running cadence, bicycle cadence, calories in the detailed track. It also
> provides summary data in the form of laps.

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
