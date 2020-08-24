# ShapefileLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Shapefile loader

| Loader                | Characteristic                                                           |
| --------------------- | ------------------------------------------------------------------------ |
| File Extension        | `.shp`,                                                                  |
| File Type             | Binary, Multi-File                                                       |
| File Format           | [Shapefile](https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf) |
| Data Format           | [Geometry](/docs/specifications/category-gis)                            |
| Supported APIs        | `load`, `parse`, `parseSync`                                             |
| Decoder Type          | Synchronous                                                              |
| Worker Thread Support | Yes, For Some Loaders                                                    |

## Usage

```js
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const data = await load(url, ShapefileLoader);
```

## Options

N/A

## Format Summary

ESRI Shapefiles are a popular file format for storing geospatial vector data.
The format consists of a number of files that must be stored together and with
the same file name. Files with extensions `.shp`, `.shx`, `.dbf` must exist;
additional files with other extensions such as `.prj` and `.cpg` may exist.

| File   | Type   | Contents                                                                                                       |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `.shp` | Binary | The geometry, i.e. the geometry column in the resulting table.                                                 |
| `.dbf` | Binary | The attributes, i.e. the data columns in the resulting table.                                                  |
| `.shx` | Binary | The index (technically required, however it is sometimes possible to open shapefiles without the index)        |
| `.prj` | Text   | A small usually single line text file containing a WKT-CRS style projection. WGS84 is assumed if not present.  |
| `.cpg` | Text   | A small text file containing a text encoding name for the DBF text fields. `latin1` is assumed if not present. |
