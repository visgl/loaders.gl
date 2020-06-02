# WKTLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.1-blue.svg?style=flat-square" alt="From-v2.1" /> 
</p>

Loader and writer for the [Well-known text] format for representation of geometry.

| Loader                | Characteristic                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.wkt`,                                                                                                      |
| File Type             | Text                                                                                                         |
| File Format           | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)                  |
| Data Format           | [Geometry](/docs/specifications/category-gis)                                                                |
| Supported APIs        | `load`, `parse`, `parseSync`                                                                                 |
| Decoder Type          | Synchronous                                                                                                  |
| Worker Thread Support | Yes [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)](http://shields.io) |

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
