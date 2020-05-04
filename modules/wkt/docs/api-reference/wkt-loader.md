# WKTLoader

Loader and writer for the [Well-known text] format for representation of geometry.

| Loader                | Characteristic                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------- |
| File Extension        | `.wkt`,                                                                                     |
| File Type             | Text                                                                                        |
| File Format           | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) |
| Data Format           | [Geometry](/docs/specifications/category-gis)                                               |
| Supported APIs        | `load`, `parse`, `parseSync`                                                                |
| Decoder Type          | Synchronous                                                                                 |
| Worker Thread Support | Yes                                                                                         |

## Usage

```js
import {WKTLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

const data = parseSync('LINESTRING (30 10, 10 30, 40 40)', WKTLoader);
// => {type: 'LineString', coordinates: [[30, 10], [10, 30], [40, 40]]}
```

```js
import {WKTLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKTLoader);
```

## Options

N/A

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
