# initializeWasmModule

Bridges WASM factories that report readiness through a callback, a thenable, or both.

```typescript
import {initializeWasmModule} from '@loaders.gl/loader-utils';

const moduleExports = await initializeWasmModule(
  (onInitialized, onError) => createModule({
    onModuleLoaded: onInitialized,
    onAbort: onError
  }),
  module => ({Decoder: module.Decoder})
);
```

## Parameters

- `initialize(onInitialized, onError)`: starts the factory and returns its thenable,
  if available. Forward ready and error callbacks supported by the dependency.
- `extractExports(module)`: performs module setup and returns a plain,
  non-thenable export object. Never return the raw Emscripten module.

The returned promise resolves with the extracted exports or rejects with the
original factory, callback, or setup error. Setup runs at most once, including
when both callback and promise report readiness. A failure callback prevents late
ready callbacks from running setup.

This utility cannot detect asynchronous failures hidden by a dependency that
exposes neither a rejecting thenable nor an error callback. Promise-native
initializers whose results are safe to await can use `async`/`await` directly.
