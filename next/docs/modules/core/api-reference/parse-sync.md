Core parsing API

# Use a synchronous parser when the loader supports it.

`parseSync` turns already-loaded text or binary data into a decoded result without returning a promise. It is useful for small, local inputs, but most loaders and browser pipelines should use the asynchronous APIs.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Async parse](https://loaders.gl/next/docs/modules/core/api-reference/parse.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse.md)[Loader options](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

The sync boundary

## Load first. Parse immediately. Keep the call site explicit.

Synchronous parsing does not fetch data and cannot suspend for worker setup or asynchronous codecs. The loader must provide a synchronous parser for the chosen input.

01

Input

Text or binary data already in memory

02

Loader

A parser-capable loader or loader list

03

Context

Options and optional source URL

04

Output

Decoded value, or an error when sync parsing is unavailable

caution

Synchronous parsing requires a parser-bearing loader with `parseSync` or `parseTextSync`. Metadata loaders must be preloaded first. Use `parse` for loaders that only provide asynchronous parsing.

## Signature[​](#signature "Direct link to Signature")

```
parseSync(data, loader, options?, context?): unknown
```

* `data`: a `string`, `ArrayBuffer`, shared array buffer, or typed-array view. Fetch responses, files, blobs, streams, iterators, and promises must be read before this call; use the async `parse` API for those inputs.
* `loader`: one parser-bearing loader or an array of candidates.
* `options`: see [LoaderOptions](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md).
* `context`: optional loader context, including a `url` hint for selection.

Returns the loader's decoded value. It throws if no loader matches or synchronous parsing is unavailable. `core.nothrow: true` returns `null` when selection fails; it does not turn an asynchronous parser into a synchronous one.

## Usage[​](#usage "Direct link to Usage")

```
import {fetchFile, parseSync, preload} from '@loaders.gl/core';

import {OBJLoader} from '@loaders.gl/scene/obj';



const response = await fetchFile(url);

const arrayBuffer = await response.arrayBuffer();

const parserLoader = await preload(OBJLoader);

const mesh = parseSync(arrayBuffer, parserLoader);
```

Handle errors with an ordinary `try`/`catch`; `parseSync` does not return a promise. Inside a composite loader, use `parseSyncFromContext` from `@loaders.gl/core/loader-utils` to preserve the parent context.
