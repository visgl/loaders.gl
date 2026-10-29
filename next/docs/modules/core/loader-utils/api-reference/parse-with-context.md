Loader utilities / composition

# Let a composite loader delegate without losing context.

parseFromContext() and its synchronous and batched variants provide a shared way for one loader to invoke another for embedded data or associated resources. Parent options, paths, and runtime context remain available to the sub-loader.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[Composite loaders](https://loaders.gl/next/docs/developer-guide/composite-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/composite-loaders.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

Delegated parsing

## Keep nested formats inside the same loading contract.

A composite format can slice or locate embedded data, then call the appropriate sub-loader with the context that explains where that data came from and how related resources should resolve.

01

Locate

Extract embedded or associated content from the parent format.

02

Delegate

Call a sub-loader through the context-aware helper.

03

Preserve

Carry options, paths, and runtime hooks across the boundary.

04

Choose

Use async, sync, or batched variants for the nested data.

Detailed guide

## parseFromContext reference

The detailed reference covers async, sync, and batched delegation, loader context, options, and composite-loader usage.

Use these helpers inside a composite loader to delegate parsing while retaining its loader context. They are exported from `@loaders.gl/core/loader-utils`.

## Usage[​](#usage "Direct link to Usage")

```
import {parseFromContext} from '@loaders.gl/core/loader-utils';

import {OBJLoader} from '@loaders.gl/scene/obj';



async function parseEmbeddedMesh(arrayBuffer, options, context) {

  const meshBytes = arrayBuffer.slice(100, 200);

  return await parseFromContext(meshBytes, OBJLoader, options, context);

}
```

## Functions[​](#functions "Direct link to Functions")

| Helper                                                      | Result                             | Requirement                                                      |
| ----------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `parseFromContext(data, loader, options, context)`          | Promise of decoded data            | Parent parsing context.                                          |
| `parseSyncFromContext(data, loader, options, context)`      | Decoded data                       | Context with synchronous parsing and a synchronous child parser. |
| `parseInBatchesFromContext(data, loader, options, context)` | Promise of an async batch iterable | Context with batched parsing.                                    |

Pass the context supplied to the parent parser. Published loader modules must not import core to make nested parsing calls. New implementations can also use the `context.coreApi` methods, passing the parent context explicitly.
