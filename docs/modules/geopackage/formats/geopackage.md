import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';

# Geopackage

<GeoPackageDocsTabs active="overview" />

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `@loaders.gl/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

## Scan support

`GeoPackageSource` discovers the feature tables in a package and exposes one selected table as an
Arrow feature table. The current implementation favors portability and correctness over SQLite
query pushdown.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `read()` | One materialized Arrow batch |
| Table and schema discovery | Supported | GeoPackage catalog and selected feature table |
| Geometry role and source bounds | Supported | Exposed through scan metadata |
| Attribute predicate | Supported | Residual after decoding |
| Projection and global limit | Supported | Residual |
| Streaming and cancellation | Not advertised | The selected table is materialized |
| SQLite or spatial-index pushdown | Not implemented | No pushdown claim is made |

Choose the feature table through the source options before calling `getQueryMetadata()` or
`read()`. Predicate columns remain available for filtering even when they are absent from the final
projection.
