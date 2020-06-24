# DBFLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Shapefile loader

| Loader                | Characteristic                               |
| --------------------- | -------------------------------------------- |
| File Extension        | `.shp`,                                      |
| File Type             | Binary                                       |
| File Format           | Shapefiles                                   |
| Data Format           | [Table](/docs/specifications/category-table) |
| Supported APIs        | `load`, `parse`, `parseSync`                 |
| Decoder Type          | Synchronous                                  |
| Worker Thread Support | Yes                                          |

## Usage

```js
import {DBFLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const data = await load(url, DBFLoader);
```

## Options

N/A

## Format Summary

ESRI Shapefiles are the historical standard for storing Geospatial vector data.
The format has been around since the late 90s, so a huge amount of data is in
this format.

The Shapefile format consists of a number of files that are designed to be kept
together: `.shp`, `.shx`, `.dbf`, and possibly others.

## References:

- https://www.clicketyclick.dk/databases/xbase/format/data_types.html
- http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm
- http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Geoprocessing_considerations_for_shapefile_output
- https://www.loc.gov/preservation/digital/formats/fdd/fdd000326.shtml
- https://support.esri.com/en/technical-article/000013192
