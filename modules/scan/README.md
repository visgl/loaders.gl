# @loaders.gl/scan

Optional scan planning and execution for loaders.gl.

The package has one public entry point. Arrow is the built-in reference executor and establishes
the portable query semantics used by future backends.

```typescript
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/scan';

const engine = await createScanEngine();
const result = engine.query(table, {
  predicate: parseSQLPredicate('population >= 1000000'),
  columns: ['name', 'population'],
  limit: 100
});
```

Optional backends can register a lazy loader without adding backend-specific imports to application
code:

```typescript
import {createScanEngine, registerScanBackend} from '@loaders.gl/scan';

registerScanBackend('custom', async () => {
  const {createCustomBackend} = await import('./custom-backend');
  return createCustomBackend();
});

const engine = await createScanEngine({backend: 'custom'});
```

Format packages should depend on the lightweight scan contracts in `@loaders.gl/loader-utils` and
should not import this package merely to expose metadata or a native scan adapter. Applications opt
into this package when they want the shared planner or Arrow executor.

The package also provides the application-facing query state and metadata vocabulary used by
metadata-driven controls. These are deliberately framework-neutral:

```typescript
import type {ScanQuery, ScanQueryMetadata} from '@loaders.gl/scan';

const query: ScanQuery = {columns: ['name'], limit: 25};
async function discover(source: {getQueryMetadata(): Promise<ScanQueryMetadata>}) {
  return await source.getQueryMetadata();
}
```

`ScanQuery` is a portable control shape. Sources normalize unsupported fields and advertise their
actual capabilities through `ScanQueryMetadata`; no React, GPU, or database dependency is pulled
into applications that only use a format loader.

Metadata also makes the execution conclusion explicit:

```typescript
const metadata = await source.getQueryMetadata();

if (metadata.execution.status === 'supported') {
  console.log(`Execute with source.${metadata.execution.method}()`);
} else {
  console.log(`Discovery only: ${metadata.execution.reason}`);
}
```

A supported table source names `read()` or `query()`, a raster source names `getRaster()`, and a
point-cloud source names `scan()`. Metadata-only sources must supply a user-facing reason. This
keeps query panels and support documentation from inferring readiness from optimization
capabilities: a residual operator is fully supported even though it performs more work, while a
metadata-only source never presents an executable scan.

Point-cloud sources implement `PointCloudScanSource` and can share
`selectPointCloudScanTiles()`. The planner traverses hierarchy nodes in deterministic breadth-first
order, prunes by bounds, level, and spacing, and leaves exact point bounds and attribute predicates
to the physical adapter. COPC and Potree use this contract to emit bounded Arrow batches with one
global limit.

Raster sources implement `getRaster()` and publish raster-specific capabilities independently of
table operators. NetCDF supports numeric variable selection and named dimension index or half-open
range slices. GeoTIFF, OME-TIFF, GeoZarr, and OME-Zarr retain their format-specific window, level,
channel, and chunk planners behind the same metadata vocabulary.
