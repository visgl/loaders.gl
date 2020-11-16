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

| Option           | Type    | Default | Description                                                                                                                                                                                                                                                                |
| ---------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shp.maxDimension | Integer | `4`     | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |

## Output

The `ShapefileLoader`'s output looks like the following. `geometries` holds an
array of features in loaders.gl's binary geometry format. `prj` contains the
Shapefile's projection string. `header` contains the Shapefile's header values,
including a bounding box of the data and the file's geometry type. Consult the
[Shapefile specification][shapefile_spec] for the meaning of the numeric types.

[shapefile_spec]: https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8

```
{
  geometries: [ { positions: [Object], type: 'Point' } ],
  header: {
    magic: 9994,
    length: 136,
    version: 1000,
    type: 11,
    bbox: {
      minX: 1,
      minY: 2,
      minZ: 3,
      minM: 0,
      maxX: 1,
      maxY: 2,
      maxZ: 3,
      maxM: 0
    }
  },
  progress: { bytesUsed: 0, bytesTotal: 136, rows: 1 },
  currentIndex: 2
}
```

## Format Summary

ESRI Shapefiles are a popular file format for storing geospatial vector data.
The format consists of a number of files that must be stored together and with
the same file name. Files with extensions `.shp`, `.shx`, `.dbf` must exist;
additional files with other extensions such as `.prj` and `.cpg` may exist.
