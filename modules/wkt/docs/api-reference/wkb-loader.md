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

// prettier-ignore
const buffer = new Uint8Array([
  1, 1, 0, 0,   0,  0,  0,
  0, 0, 0, 0, 240, 63,  0,
  0, 0, 0, 0,   0,  0, 64
]).buffer;
const data = parseSync(buffer, WKBLoader);
// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }
```

```js
import {WKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKBLoader);
```

## Options

N/A

## Format Summary

Well-known binary (WKB) is a binary geometry encoding to store geometries (it
doesn't store attributes). It's used in databases such as PostGIS and as the
internal storage format of Shapefiles. It's also being discussed as the internal
storage format for a ["GeoArrow"](https://github.com/geopandas/geo-arrow-spec)
specification. WKB is defined starting on page 62 of the [OGC Simple Features
specification](http://portal.opengeospatial.org/files/?artifact_id=25355).

It's essentially a binary representation of WKT. For common geospatial types
including (Multi) `Point`, `Line`, and `Polygon`, there's a 1:1 correspondence
between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types,
such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to
GeoJSON.

- Coordinates can be 2-4 dimensions and are interleaved.
- Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
