# SHPLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Shapefile loader

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.shp`,                                       |
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

ESRI Shapefiles are the historical standard for storing Geospatial vector data.
The format has been around since the late 90s, so a huge amount of data is in
this format.

The Shapefile format consists of a number of files that are designed to be kept
together: `.shp`, `.shx`, `.dbf`, and possibly others.
