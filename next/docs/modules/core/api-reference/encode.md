Core writing API

# Turn application data back into a format.

`encode()` hands category data to a writer and returns the encoded bytes. Use it when your application has already loaded or transformed the data and the next step is export, persistence, or transfer.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)[Writer object format](https://loaders.gl/next/docs/specifications/writer-object-format.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/writer-object-format.md)

The encode boundary

## Start with data. Let the writer define the output.

Writers own the target format and its options. The core API can use a worker when the writer supports it, while synchronous and batched variants make the execution model explicit.

01

Input

Category data accepted by the writer

02

Writer

A writer with an async or sync encoder

03

Execution

Main thread, worker, or Node command-line tool

04

Output

ArrayBuffer, text, or an async byte sequence

Detailed guide

## Encoding details

The reference below covers atomic, text, synchronous, batched, and Node-only URL-to-URL encoding.

## Atomic encoding[​](#atomic-encoding "Direct link to Atomic encoding")

```
encode(data, writer, options?): Promise<ArrayBuffer>

encodeSync(data, writer, options?): ArrayBuffer
```

`encode()` calls the writer asynchronously and may use the writer’s worker implementation. The writer determines the accepted data shape and the format of the returned bytes. `encodeSync()` requires a synchronous writer implementation and throws when the writer cannot encode synchronously.

```
import {encode} from '@loaders.gl/core';

import {DracoWriter} from '@loaders.gl/draco';



const arrayBuffer = await encode(meshData, DracoWriter);
```

## Text and batch variants[​](#text-and-batch-variants "Direct link to Text and batch variants")

```
encodeText(data, writer, options?): Promise<string>

encodeTextSync(data, writer, options?): string

encodeInBatches(data, writer, options?): AsyncIterable<ArrayBuffer>
```

Text helpers are convenience APIs and may convert through bytes when the writer does not expose a native text encoder. `encodeInBatches` requires the writer to implement its batch method; they do not silently fall back to one large atomic encode.

## Options[​](#options "Direct link to Options")

* `options` are passed to the writer and may include loader-utils module overrides.
* `options.modules` supplies top-level overrides for writers that load external JavaScript or WASM runtimes.
* `options.log` accepts an object with `log`, `info`, `warn`, and `error` methods. Set it to `null` to disable logging where supported.

## Node-only URL conversion[​](#node-only-url-conversion "Direct link to Node-only URL conversion")

Writers that expose `encodeURLtoURL()` can convert one file to another through an external command line tool in Node.js:

```
encodeURLtoURL(inputUrl, outputUrl, writer, options?): Promise<string>
```

This path is not available in the browser and depends on the writer’s command-line integration.
