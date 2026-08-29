---
title: GeoPackage format
description: A SQLite-based package for portable geospatial feature tables, tiles, and metadata.
hide_title: true
page_style: designed
---

import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';
import {DatasetDiscoveryGraphic} from '@site/src/components/docs/dataset-discovery-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Portable geospatial package"
  title="Carry feature tables and their metadata together."
  description="GeoPackage uses SQLite to package geospatial tables and metadata in one portable file. loaders.gl can discover a feature table and expose it through the common table shape."
  tone="orange"
  meta={['SQLite container', 'OGC standard', 'Feature tables']}
  links={[
    {label: 'GeoPackage module', to: '/docs/modules/geopackage'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<GeoPackageDocsTabs active="overview" />

<DatasetDiscoveryGraphic kind="geopackage" />

<DocOrientation
  eyebrow="The package boundary"
  title="Discover the table before reading the rows."
  description="A GeoPackage may contain several feature tables. The source first discovers the package catalog, then reads the selected table into a consistent Arrow feature shape."
  tone="orange"
  items={[
    {label: 'Container', value: 'SQLite database in one file'},
    {label: 'Catalog', value: 'Feature tables, geometry columns, and bounds'},
    {label: 'Output', value: 'Arrow feature table with geometry metadata'},
    {label: 'Execution', value: 'Materialized read with residual filtering'}
  ]}
/>

<p className="badges">
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

<ReferenceBoundary
  title="GeoPackage structure and execution"
  description="The sections below cover package metadata, feature-table selection, geometry handling, and the current scan execution boundary."
  tone="orange"
/>
