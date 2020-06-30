# DBFLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Shapefile loader: DBF (attributes)

| Loader                | Characteristic                               |
| --------------------- | -------------------------------------------- |
| File Extension        | `.dbf`,                                      |
| File Type             | Binary                                       |
| File Format           | Shapefiles                                   |
| Data Format           | [Table](/docs/specifications/category-table) |
| Supported APIs        | `load`, `parse`, `parseSync`                 |
| Decoder Type          | Synchronous                                  |
| Worker Thread Support | Yes                                          |

## Usage

The `DBFLoader` parses feature attributes from the Shapefile format.

```js
import {DBFLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const options = {
  dbf: {
    encoding: 'utf8'
  }
};
const data = await load(url, DBFLoader, options);
// [{foo: null}, {foo: 'blue'}, {foo: 'green'}];
```

## Options

- `encoding`: text encoding of DBF file: usually either `utf8`, or `ascii`/`windows-1252`. For Shapefiles, there's often a `.cpg` file designating the encoding used.

## Format Summary

ESRI Shapefiles are a popular file format for storing geospatial vector data.
The format consists of a number of files that must be stored together and with
the same file name.

## References:

- https://www.clicketyclick.dk/databases/xbase/format/data_types.html
- http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm
- http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Geoprocessing_considerations_for_shapefile_output
- https://www.loc.gov/preservation/digital/formats/fdd/fdd000326.shtml
- https://support.esri.com/en/technical-article/000013192
