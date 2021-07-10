# LoaderOptions

APIs in `@loaders.gl/core` takes an `options?: LoaderOptions` parameter. The options are documented on this page.

## Loader specific options

The options object can contain loader specific options. The options for each loader are supplied in a sub object, 
see the documentation for each loader for details:

```typescript
{
  csv: {
    shape: 'row-object-table'
  },
  json: {
    shape: 'row-object-table'
  }
}
```

## Top-level options

Top level options are interpreted by the core API and apply to all loaders.

| Option                           | Type               | Default    | Description                                                                                                                                                                                                       |
| -------------------------------- | ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.fetch`                  | `object` or `function` | -  | Specifies either a `RequestInit` object containing options to pass to `fetchFile`, or a function that is called in place of `fetchFile` to fetch data in any subloaders.                                                             |
| `options.nothrow`                | `boolean` | `false`       | Specifies either an object with options to pass to `fetchFile`, or a function that is called in place of `fetchFile` to fetch data in any subloaders.                                                             |
| `options.metadata`               | `boolean`            | `false`    | Currently only implemented for `parseInBatches`, adds initial metadata batch                                                                                                                                      |
| `options.log`                    | `object`             | `console`  | By default set to a `console` wrapper. Setting log to `null` will turn off logging.                                                                                                                               |
| `options.worker`                 | `boolean`            | `true`     | Runs the loader on a worker thread, if the selected loader and the runtime environment support it.                                                                                          |
| `options.maxConcurrency`         | `number`             | `3`        | How many worker instances should be created for each loader. Note that setting this higher than roughly the number CPU cores on your current machine will not provide much benefit and may create extra overhead. |
| `option.maxMobileConcurrency`    | `number`             | `1`        | How many worker instances should be created for each loader on mobile devices. Mobile devicee have fewer cores and less memory available.                                                                         |
| `options.reuseWorkers`           | `boolean`            | `true`     | By default, worker threads are kept in memory and reused. But if `reuseWorkers` is `false` workers will be automatically terminated after job completion and reloaded for each job.                               |
| `options.<loader-id>.workerUrl`  | `string`             | per-loader | If the corresponding loader can parse on a worker, the url to the worker script can be controller with this option.                                                                                               |
| `options.modules`                | `object`             | -          | Supply bundled modules (like draco3d) instead of loading from CDN.                                                                                                                                                |
| `options.CDN` (experimental)     | `string`             | -          | Controls certain script loading from CDN. `true` loads from `unpkg.com/@loaders.gl`. `false` load from local urls. `string` alternate CDN url.                                                                    |

## Batched parsing options

| Option                       | Type          | Default                    | Description                                                                                               |
| ---------------------------- | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.metadata`           | `boolean`     | `false`                    | An initial batch with `batchType: 'metadata'` will be added with information about the data being loaded. |
| `options.batches.chunkSize?` | `number`      | N/A                        | When set, "atomic" inputs (like `ArrayBuffer` or `string`) are chunked, enabling batched parsing.         | No effect if input is already an iterator or stream.                                                                                                  |
| `options.transforms`         | `*[]` | `[]`                       | An array with transform functions that can be applied to the input data before parsing.                            |

Notes:
- `transforms` is an array functions that accept and return an `AsyncIterable<ArrayBuffer>`
