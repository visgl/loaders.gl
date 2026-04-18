# LoaderOptions

APIs in `@loaders.gl/core` takes an `options?: LoaderOptions` parameter. The options are documented on this page.

## Core options

Options interpreted by the core API and shared across loaders live under `options.core`.

| Option                               | Type                   | Default    | Description                                                                                                                                                                                                       |
| ------------------------------------ | ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.core.fetch`                 | `object` or `function` | -          | Specifies either a `RequestInit` object containing options to pass to `fetchFile`, or a function that is called in place of `fetchFile` to fetch data in any subloaders.                                          |
| `options.core.nothrow`               | `boolean`              | `false`    | Prevents throwing on loader errors and lets callers inspect failures manually.                                                                                                                                     |
| `options.core.mimeType`              | `string`               | -          | Loader selection will first look for a loader matching `mimeType`. A specific loader can be specified using `'application/x-<loader.id>'`.                                                                       |
| `options.core.fallbackMimeType`      | `string`               | -          | Loader selection fallback `mimeType` in case one is not provided by the server. A specific loader can be specified with `'application/x-<loader.id>'`.                                                            |
|                                 |
| `options.core.log`                   | `object`               | `console`  | By default set to a `console` wrapper. Setting log to `null` will turn off logging.                                                                                                                               |
| `options.core.worker`                | `boolean`              | `true`     | Runs the loader on a worker thread, if the selected loader and the runtime environment support it.                                                                                                                |
| `options.core.maxConcurrency`        | `number`               | `3`        | How many worker instances should be created for each loader. Note that setting this higher than roughly the number CPU cores on your current machine will not provide much benefit and may create extra overhead. |
| `option.core.maxMobileConcurrency`   | `number`               | `1`        | How many worker instances should be created for each loader on mobile devices. Mobile devices have fewer cores and less memory available.                                                                         |
| `options.core.reuseWorkers`          | `boolean`              | `true`     | By default, worker threads are kept in memory and reused. But if `reuseWorkers` is `false` workers will be automatically terminated after job completion and reloaded for each job.                               |
| `options.<loader-id>.workerUrl` | `string`               | per-loader | If the corresponding loader can parse on a worker, the url to the worker script can be controller with this option.                                                                                               |
| `options.modules`               | `object`               | -          | Supply bundled JS/WASM runtime modules or URL overrides. See the [dependency guide](/docs/developer-guide/dependencies) and individual loader or writer docs for supported keys.                                  |
| `options.core.CDN` (🚧 experimental) | `string`               | -          | Controls certain script loading from CDN. `true` loads from `unpkg.com/@loaders.gl`. `false` loads from local urls. `string` uses an alternate CDN url.                                                           |
| `options.core.shape`                 | `string`               | per-loader | Shared default return shape for loaders that support shape selection. For example, `options.core.shape = 'object-row-table'` applies to row-table loaders unless a loader-specific option like `options.csv.shape` overrides it. |

Deprecated top-level aliases such as `options.fetch`, `options.worker`, and `options.shape` are still accepted for compatibility, but new code should use `options.core`.

## Loader specific options

The options object can contain loader specific options. The options for each loader are supplied in a sub object,
see the documentation for each loader for details:

```typescript
{
  core: {
    shape: 'object-row-table'
  },
  csv: {
    shape: 'array-row-table'
  },
  json: {
    shape: 'object-row-table'
  }
}
```

## Batched parsing options

| Option                       | Type      | Default | Description                                                                                                                                            |
| ---------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options.core.metadata`      | `boolean` | `false` | An initial batch with `batchType: 'metadata'` will be added with information about the data being loaded.                                              |
| `options.batches.chunkSize?` | `number`  | N/A     | When set, "atomic" inputs (like `ArrayBuffer` or `string`) are chunked, enabling batched parsing. No effect if input is already an iterator or stream. |
| `options.core.transforms`    | `*[]`     | `[]`    | An array with transform functions that can be applied to the input data before parsing.                                                                |

Notes:

- `transforms` is an array functions that accept and return an `AsyncIterable<ArrayBuffer>`
