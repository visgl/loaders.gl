---
title: GeoPackageSource
description: Discover GeoPackage tables and read selected data as Arrow.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';

<DocPageHeader
  eyebrow="GeoPackage source"
  title="Open a database file, then choose the table."
  description="`GeoPackageSource` exposes GeoPackage table metadata and reads a selected table into the common Arrow table shape. It keeps database discovery separate from the application’s table-processing path."
  tone="yellow"
  meta={['GeoPackage', 'Table discovery', 'Arrow output']}
  links={[
    {label: 'GeoPackage module', to: '/docs/modules/geopackage'},
    {label: 'GeoPackage format', to: '/docs/modules/geopackage/formats/geopackage'},
    {label: 'Arrow data plane', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The database-file path"
  title="Discover tables first. Read the one you need."
  description="The source opens the GeoPackage, reports available vector tables and geometry metadata, and applies the same default-table behavior as the loader when a table is selected."
  tone="yellow"
  items={[
    {label: 'Open', value: 'GeoPackage URL or supported loaded data'},
    {label: 'Discover', value: 'Tables, geometry columns, and default selection'},
    {label: 'Read', value: 'One selected table with loader options'},
    {label: 'Output', value: 'ArrowTable with GeoPackage metadata'}
  ]}
/>

<GeoPackageDocsTabs active="source" />

<ReferenceBoundary
  title="Source contract"
  description="The short reference below covers construction, metadata discovery, table selection, and output shape."
  tone="yellow"
/>

`GeoPackageSource` is a GeoPackage-specific source that exposes table metadata and one-table Arrow loads.

```typescript
import {createDataSource} from '@loaders.gl/core';
import {GeoPackageSource} from '@loaders.gl/geopackage';

const dataSource = createDataSource(url, [GeoPackageSource], {geopackage: {}});
const metadata = await dataSource.getMetadata();
const table = await dataSource.getTable(metadata.tables[0]?.name);
```

`getMetadata()` returns available vector tables, including geometry column metadata and the selected default table.

`getTable(tableName?)` returns the selected table as an `ArrowTable` using the same default-table heuristic as `GeoPackageLoader` with `geopackage.shape: 'arrow-table'`.
