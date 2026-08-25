# Overview

![ogc-logo](../../images/logos/ogc-logo-60.png)

The `@loaders.gl/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

## Installation

```bash
npm install @loaders.gl/geopackage
```

## Loaders and Writers

| Loader / Source | Description |
| --------------- | ----------- |
| [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | Loads GeoPackage files and exposes their tables and layers. |
| [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source) | Provides access to GeoPackage tables as a data source. |

## Attribution

The GeoPackage loaders and source use [SQL.js](https://sql.js.org/) under the MIT license.
