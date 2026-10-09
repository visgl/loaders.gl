---
title: Schema utilities
---

# Schema and table utilities

`@loaders.gl/schema-utils` provides table access, schema conversion, batch
construction, and the dispatcher for explicit converter sets.

```bash
npm install @loaders.gl/schema-utils
```

| API group | Examples |
| --- | --- |
| Conversion | `convert`, `TableConverter`, `TABLE_CONVERTERS` |
| Schema conversion | `convertArrowToSchema`, `convertSchemaToArrow`, `serializeArrowSchema`, `deserializeArrowSchema` |
| Table access | `getTableLength`, `getTableCell`, `getTableRowAsObject`, `makeRowIterator` |
| Batch construction | `TableBatchBuilder`, `makeTableBatchIterator`, `makeBatchFromTable` |
| Arrow queries | `queryArrowTable`, `selectArrowTableRows` |
| Mesh tables | `convertMeshToTable`, `convertTableToMesh`, `getMeshBoundingBox` |

## Converting table representations

```typescript
import {convert, TABLE_CONVERTERS} from '@loaders.gl/schema-utils';

const table = {shape: 'object-row-table', data: [{id: 1, name: 'Alice'}]};
const columns = convert(table, 'columnar-table', [...TABLE_CONVERTERS]);
```

The dispatcher uses the supplied converters to detect the input shape and find
a supported conversion path. It throws when detection is ambiguous or no path
exists. Geometry conversion requires the separate
[GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters).

See [converter usage](/docs/developer-guide/converters/dispatcher) and
[table representations](/docs/specifications/category-table).
