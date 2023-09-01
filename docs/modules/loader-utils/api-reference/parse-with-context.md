# parseWithContext

Use when invoking a sub-loader from a loader, to parse embedded data or perhaps an associated resource.

## Usage

```typescript
import {parseWithContext} from '@loaders.gl/loader-utils';
import {OBJLoader} from '@loaders.gl/obj';

parse(data: ArrayBuffer, options: LoaderOptions, context?: LoaderContext) {
  const subData = data.slice(100, 200);
  data = await parseWithContext(subData, OBJLoader, options, context);
}
...
```

## Functions

### parse

### parseSyncWithContext

### parseInBatchesWithContext

