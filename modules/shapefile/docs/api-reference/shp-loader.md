# SHPLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

A "sub loader" for the `.shp` (geometries) file component of a shapefile.

Note: Most applications will want to use the `ShapefileLoader` instead of this loader.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.shp`                                        |
| File Type             | Binary                                        |
| File Format           | Shapefiles                                    |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`, `parseSync`                  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |

## Usage

```js
import {SHPLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const data = await load(url, SHPLoader);
```

## Options

N/A

## Format Summary

ESRI Shapefiles are a popular file format for storing geospatial vector data.
The format consists of a number of files that must be stored together and with
the same file name. Files with extensions `.shp`, `.shx`, `.dbf` must exist;
additional files with other extensions such as `.prj` and `.cpg` may exist.
