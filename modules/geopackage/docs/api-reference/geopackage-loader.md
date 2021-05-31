# GeoPackageLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

GeoPackage loader

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.gpkg`,                                      |
| File Type             | Binary                                        |
| File Format           | [GeoPackage](https://www.geopackage.org/)     |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`                               |
| Decoder Type          | Asynchronous                                  |
| Worker Thread Support | No                                            |

## Usage

```js
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoPackageLoader);
```

## Options

| Option                | Type   | Default                      | Description                                                                                                            |
| --------------------- | ------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `geopackage.sqlJsCDN` | String | `'https://sql.js.org/dist/'` | CDN from which to load the SQL.js bundle. This is loaded asynchronously when the GeoPackageLoader is called on a file. |

## Output

The `GeoPackageLoader`'s output is a mapping from table name to an array of GeoJSON features. It currently loads all features from all vector tables.

## Future Work

- Select a single vector layer/table to load. Right now all vector tables are loaded. This would fit well in the two-stage loader process, where the first stage reads metadata from the file (i.e. the list of available layers) and the second stage loads one or more
- Binary and GeoJSON output. Right now the output is GeoJSON-only, and is contained within an object mapping table names to geometry data. This is the same problem as we discussed previously for MVT, where with GeoPackage especially it's decently likely to only desire a portion of the layers contained in the file.
