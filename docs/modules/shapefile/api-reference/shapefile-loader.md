import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';

# ShapefileLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

<ShapefileDocsTabs active="loader" />

The `ShapefileLoader` parses Shapefile datasets into loaders.gl geometry tables.

## Usage

```typescript
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const data = await load(url, ShapefileLoader);
const table = await load(url, ShapefileLoader, {shapefile: {shape: 'arrow-table'}});
```

## Shapes

`ShapefileLoader` returns the legacy v3 shapefile output by default. Set `shapefile.shape` to select another representation.

| Shape              | Output                                      |
| ------------------ | ------------------------------------------- |
| `v3`               | legacy Shapefile output object              |
| `geojson-table`    | loaders.gl GeoJSON table                    |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry   |

## Options

| Option              | Type    | Default | Description                                                                                                                                                                                                                                                                |
| ------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shapefile.shape     | String  | `'v3'`  | Output shape: `'v3'`, `'geojson-table'`, or `'arrow-table'`.                                                                                                                                                                                                               |
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
