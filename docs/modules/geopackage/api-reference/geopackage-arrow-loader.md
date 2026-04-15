# GeoPackageArrowLoader

`GeoPackageArrowLoader(tableName?)` loads one GeoPackage vector table into a loaders.gl `ArrowTable`.

- Geometry is returned in a WKB `geometry` column.
- The Arrow schema includes geospatial metadata for that column.
- When no table name is supplied, the loader uses GeoPackage metadata to look for a preferred table and otherwise falls back to the first vector table in `gpkg_contents`.

```typescript
import {load} from '@loaders.gl/core';
import {GeoPackageArrowLoader} from '@loaders.gl/geopackage';

const table = await load(url, GeoPackageArrowLoader('roads'));
```

You can also omit the factory argument and pass the table name through `options.geopackage.table`.
