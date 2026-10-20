---
title: Schema utilities
---

# Schema and table utilities

`@loaders.gl/core/schema-utils` provides table access, schema conversion, batch
construction, and the dispatcher for explicit converter sets.

```bash
npm install @loaders.gl/core
```

| API group | Examples |
| --- | --- |
| Conversion | `convert`, `TableConverter`, `TABLE_CONVERTERS` |
| Schema conversion | `convertArrowToSchema`, `convertSchemaToArrow`, `serializeArrowSchema`, `deserializeArrowSchema` |
| Table access | `getTableLength`, `getTableCell`, `getTableRowAsObject`, `makeRowIterator` |
| Batch construction | `TableBatchBuilder`, `makeTableBatchIterator`, `makeBatchFromTable` |
| Arrow queries | `queryArrowTable`, `selectArrowTableRows` |
| Point authoring | `PointCloudTiler` (bounded additive octree from decoded Mesh/Arrow points) |
| Mesh tables | `convertMeshToTable`, `convertTableToMesh`, `getMeshBoundingBox` |

## Converting table representations

```typescript
import {convert, TABLE_CONVERTERS} from '@loaders.gl/core/schema-utils';

const table = {shape: 'object-row-table', data: [{id: 1, name: 'Alice'}]};
const columns = convert(table, 'columnar-table', [...TABLE_CONVERTERS]);
```

The dispatcher uses the supplied converters to detect the input shape and find
a supported conversion path. It throws when detection is ambiguous or no path
exists. Geometry conversion requires the separate
[GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters).

See [converter usage](/docs/developer-guide/converters/dispatcher) and
[table representations](/docs/specifications/category-table).

See the [dynamic point source reference](/docs/modules/tiles-3d/api-reference/point-cloud-tile-source)
for `PointCloudTiler` ownership, coordinate and memory-limit contracts.

## Arrow worker transport

Use the dedicated subpath when passing Arrow tables across a worker boundary:

```typescript
import {tableFromArrays} from 'apache-arrow';
import {dehydrateArrowTable, hydrateArrowTable, splitArrowBuffers} from '@loaders.gl/core/schema-utils/arrow-transport';

const table = tableFromArrays({value: [1, 2]});
const transferableTable = splitArrowBuffers(table, {copy: 'sliced'});
const payload = dehydrateArrowTable(transferableTable);
const restoredTable = hydrateArrowTable(payload);
```

The payload is structured-cloneable and preserves Arrow schema, vectors, dictionaries,
and record batches. The receiving runtime must use a compatible Apache Arrow version.
`splitArrowBuffers` separates sliced backing buffers; its `copy` option also supports
`'none'` and `'all'`. `serializeArrowWorkerResult` and `deserializeArrowWorkerResult`
provide matching loaders.gl worker hooks. The subpath also exports IPC serialization
helpers and transport types.

The existing `@loaders.gl/arrow/transport` API forwards to this implementation.
Importing schema-utils transport avoids a dependency on the grouped table format engines.
