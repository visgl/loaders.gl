# WKBLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" />
</p>

Loader for the [Well-known binary][wkb] format for representation of geometry.

[wkb]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.wkb`,                                       |
| File Type             | Binary                                        |
| File Format           | [Well Known Binary][wkb]                      |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`, `parseSync`                  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |

## Usage

```js
import {WKBLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

const data = parseSync('LINESTRING (30 10, 10 30, 40 40)', WKBLoader);
// => {type: 'LineString', coordinates: [[30, 10], [10, 30], [40, 40]]}
```

```js
import {WKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKBLoader);
```

## Options

N/A
