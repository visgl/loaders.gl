# GeoPackageLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

GeoPackage loader

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.gpkg`                                       |
| File Type             | Binary                                        |
| File Format           | [GeoPackage](https://www.geopackage.org/)     |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`                               |
| Decoder Type          | Asynchronous                                  |
| Worker Thread Support | No                                            |

## Usage

```js
import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';
import {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';

const optionsAsTable: GeoPackageLoaderOptions = {
  geopackage: {
    sqlJsCDN: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'
  },
  gis: {
    format: 'tables'
  }
};
const tablesData: Tables<ObjectRowTable> = await load(url, GeoPackageLoader, optionsAsTable);

const optionsAsGeoJson: GeoPackageLoaderOptions = {
  geopackage: {
    sqlJsCDN: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'
  },
  gis: {
    format: 'geojson'
  }
};
const geoJsonData: Record<string, Feature[]> = await load(url, GeoPackageLoader, optionsAsGeoJson);
```

## Options

| Option                | Type   | Default                                                  | Description                                                                                                            |
| --------------------- | ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `geopackage.sqlJsCDN` | String | `'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackageLoader is called on a file. |
| `options.gis.format`  | String | `'tables'`                                               | Output format for data. If set to `geojson`                                                                            |

- `geopackage.sqlJsCDN`: As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working. Therefore this library pins to use of SQL.js version 1.5.0, and requires the WASM bundle from the same version.

## Output

The `GeoPackageLoader` currently loads all features from all vector tables.

- If `options.gis.format` is `'tables'` (the default):

  Returns `Tables<ObjectRowTable>`, an object whose `.tables` member is an array of objects with `name` and `table` keys. Each `name` member holds the name of the GeoPackage table name, and each `.table` member holds a `Table` instance. The `Table.data` member is an array of GeoJSON features, while `Table.schema` describes the schema types of the original Sqlite3 table.

- If `options.gis.format` is `'geojson'`:

  Returns `Record<string, Feature[]>`, an object mapping from table name to an array of GeoJSON features. The `Feature` type is defined in `@loaders.gl/schema`.

## Future Work

- Select a single vector layer/table to load. Right now all vector tables are loaded. This would fit well in the two-stage loader process, where the first stage reads metadata from the file (i.e. the list of available layers) and the second stage loads one or more
- Binary and GeoJSON output. Right now the output is GeoJSON-only, and is contained within an object mapping table names to geometry data. This is the same problem as we discussed previously for MVT, where with GeoPackage especially it's decently likely to only desire a portion of the layers contained in the file.
