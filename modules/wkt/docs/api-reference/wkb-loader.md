# WKBLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Loader for the [Well-known binary] format for representation of geometry.

| Loader                | Characteristic                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.wkb`,                                                                                                      |
| File Type             | Text                                                                                                         |
| File Format           | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)                  |
| Data Format           | [Geometry](/docs/specifications/category-gis)                                                                |
| Supported APIs        | `load`, `parse`, `parseSync`                                                                                 |
| Decoder Type          | Synchronous                                                                                                  |
| Worker Thread Support | Yes [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)](http://shields.io) |

## Usage

```js
import {WKBLoader} from '@loaders.gl/wkb';
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
