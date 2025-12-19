# ShapefileLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Shapefile loader

| Loader                | Characteristic                                         |
| --------------------- | ------------------------------------------------------ |
| File Format           | [Shapefile](/docs/modules/shapefile/formats/shapefile) |
| Data Format           | [Table](/docs/specifications/category-table)           |
| Data Format           | [Geometry](/docs/specifications/category-gis)          |
| File Extension        | `.shp`,                                                |
| File Type             | Binary, Multi-File                                     |
| Supported APIs        | `load`, `parse`, `parseSync`                           |
| Decoder Type          | Synchronous                                            |
| Worker Thread Support | Yes, For Some Loaders                                  |

## Usage

```typescript
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
