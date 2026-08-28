# Overview

![ogc-logo](../../images/logos/ogc-logo-60.png)

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

`GeoPackageSource` discovers selected feature-table fields and returns Arrow batches with residual
projection, predicate, and limit semantics. Spatial-index and SQL pushdown remain format-specific
optimizations.

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
