# GeoPackageLoader

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

:::caution
The `GeoPackageLoader` depends on the [`sql.js`](https://github.com/sql-js/sql.js) npm module which has caused issues with certain JavaScript bundlers. It is recommended that you do your own tests before using the `GeoPackageLoader` in your project.
:::

GeoPackage GeoJSON loader

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

To load all tables in a GeoPackage file as GeoJSON:

```typescript
import {GeoPackageLoader, GeoPackageLoaderOptions} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';
import {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';

const optionsAsTable: GeoPackageLoaderOptions = {
  geopackage: {
    shape: 'tables',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
  }
};
const tablesData: Tables<GeoJSONTable> = await load(url, GeoPackageLoader, optionsAsTable);
```

To load a specific table named `feature_table` in a GeoPackage file as GeoJSON:

```typescript
const optionsAsGeoJson: GeoPackageLoaderOptions = {
  geopackage: {
    shape: 'geojson-table',
    table: 'feature_table',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
  }
};

const geoJsonData: GeoJSONTable = await load(url, GeoPackageLoader, optionsAsGeoJson);
```

To load one vector table as Arrow instead of GeoJSON, use [`GeoPackageArrowLoader`](/docs/modules/geopackage/api-reference/geopackage-arrow-loader).

To inspect available tables first and then fetch a specific table, use [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source).

## Options

| Option                | Type   | Default                                                  | Description                                                                                                            |
| --------------------- | ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------- |
| `options.shape`       | String | `'tables'` \| '`geojson-table'`                          | Output format.                                                                                                         |
| `options.table`       | String | N/A                                                      | name of table to load                                                                                                  | Output format. |
| `geopackage.sqlJsCDN` | String | `'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackage loader is called on a file. |

## Output

The `GeoPackageLoader` currently loads GeoJSON features from GeoPackage vector tables.

- If `options.gis.format` is `'tables'` (the default):

  Returns `Tables<ObjectRowTable>`, an object whose `.tables` member is an array of objects with `name` and `table` keys. Each `name` member holds the name of the GeoPackage table name, and each `.table` member holds a `Table` instance. The `Table.data` member is an array of GeoJSON features, while `Table.schema` describes the schema types of the original Sqlite3 table.

- If `options.gis.format` is `'geojson'`:

  Returns `Record<string, Feature[]>`, an object mapping from table name to an array of GeoJSON features. The `Feature` type is defined in `@loaders.gl/schema`.

## Remarks

- `options.geopackage.sqlJsCDN`: As of March 2022, SQL.js versions 1.6.0, 1.6.1, and 1.6.2 were tested as not working.

## Notes

- GeoPackage does not define a standard preferred-table field. When a single table is not explicitly requested, loaders.gl uses best-effort metadata heuristics and otherwise falls back to the first vector table in `gpkg_contents`.
