# KMLLoader

The `KMLLoader` parses KML files into GeoJSON.

| Loader                | Characteristic                                               |
| --------------------- | ------------------------------------------------------------ |
| File Extension        | `.kml`                                                       |
| File Type             | Text                                                         |
| File Format           | [KML](https://en.wikipedia.org/wiki/Keyhole_Markup_Language) |
| Data Format           | [GIS](docs/specifications/category-gis.md)                   |
| Decoder Type          | Synchronous                                                  |
| Worker Thread Support | No                                                           |
| Streaming Support     | No                                                           |

## Usage

```js
import {KMLLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, KMLLoader, options);
```

## Options

| Option            | Type    | Default | Description                                                                                                |
| ----------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `useLngLatFormat` | Boolean | `true`  | KML longitudes and latitudes are specified as `[lat, lng]`. This option "normalizes" them to `[lng, lat]`. |
| `useColorArrays`  | Boolean | `true`  | Convert color strings to arrays.                                                                           |

## Limitations

- Currently XML parsing is only implemented in browsers, not in Node.js. Check `KMLLoader.supported` to check at run-time.
