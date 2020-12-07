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

| Option              | Type    | Default | Description                                                                                                                                                                                                                                                                |
| ------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shp.\_maxDimensions | Integer | `4`     | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |

## Output

The `ShapefileLoader`'s output looks like the following. `data` holds an array
of GeoJSON `Feature`s. `prj` contains the Shapefile's projection string.
`header` contains the Shapefile's header values, including a bounding box of the
data and the file's geometry type. Consult the [Shapefile
specification][shapefile_spec] for the meaning of the numeric types.

[shapefile_spec]: https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8

```
{
  encoding: 'ISO-8859-1',
  prj: null,
  shx: {
    offsets: Int32Array(8) [
      50, 0, 0, 0,
       0, 0, 0, 0
    ],
    lengths: Int32Array(8) [
      14, 0, 0, 0,
       0, 0, 0, 0
    ]
  },
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
  data: [ { type: 'Feature', geometry: [Object], properties: [Object] } ]
}
```

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
