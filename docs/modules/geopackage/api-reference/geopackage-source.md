# GeoPackageSource

`GeoPackageSource` is a GeoPackage-specific source that exposes table metadata and one-table Arrow loads.

```typescript
import {createDataSource} from '@loaders.gl/core';
import {GeoPackageSource} from '@loaders.gl/geopackage';

const dataSource = createDataSource(url, [GeoPackageSource], {geopackage: {}});
const metadata = await dataSource.getMetadata();
const table = await dataSource.getTable(metadata.tables[0]?.name);
```

`getMetadata()` returns available vector tables, including geometry column metadata and the selected default table.

`getTable(tableName?)` returns the selected table as an `ArrowTable` using the same default-table heuristic as `GeoPackageArrowLoader`.
