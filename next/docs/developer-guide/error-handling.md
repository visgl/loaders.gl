Failure is part of the data path

# Tell the user what failed, not just that it failed.

A load can fail while fetching bytes, while a service rejects a request, or while a parser rejects the returned data. loaders.gl keeps those failures observable through promises and exceptions.

[Authentication](https://loaders.gl/next/docs/developer-guide/authentication.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/authentication.md)[Core load API](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

Three failure boundaries

## Access, response, or content.

Handle the failure at the boundary that owns it. Preserve the original error and add request or format context when presenting a useful message to an application user.

01

Access

DNS, network, timeout, or missing resource

02

Response

HTTP status, auth, or service parameters

03

Content

Malformed or unsupported format data

04

Async API

Catch exceptions or rejected promises

Loading can fail at three boundaries:

* **Transport:** the request fails, is cancelled, or cannot access a local file.
* **HTTP response:** the server returns an unsuccessful status.
* **Parsing:** the bytes are malformed or use an unsupported format feature.

## Parsing and loading errors[​](#parsing-and-loading-errors "Direct link to Parsing and loading errors")

`load` and `parse` return promises. Use `await` inside `try`/`catch`, or attach a rejection handler. When given a `Response`, core checks its status before parsing. A parser can also reject a successful HTTP response whose contents are invalid.

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



try {

  const table = await load(url, CSVLoader);

  displayTable(table);

} catch (error) {

  showError(error instanceof Error ? error.message : String(error));

}
```

Synchronous APIs such as `parseSync` throw directly and use the same `try`/`catch` pattern. `core.nothrow` only suppresses loader-selection failure; it is not a blanket parser-error handler.

## WASM initialization errors[​](#wasm-initialization-errors "Direct link to WASM initialization errors")

Prefer `async` functions that await and return the initialization result. A thrown error or rejected factory promise then rejects the caller's promise without another wrapper.

Emscripten modules can be thenable. When a module must be consumed through a callback, resolve with a plain object containing its parser exports. Forward factory rejections and catch errors inside the success callback: a throw there does not reject a separate outer promise. Keep resource and lock cleanup in `finally`.

Basis, Draco, and Zstd use `initializeWasmModule` from `@loaders.gl/core/loader-utils` for this callback bridge. It extracts exports once, even if a factory reports readiness through both a callback and a promise. MD5 uses a native async function. The optional `zstd-codec` dependency exposes only a success callback, so asynchronous initialization failures hidden by that dependency cannot currently be forwarded by loaders.gl.

## Checking fetch responses[​](#checking-fetch-responses "Direct link to Checking fetch responses")

The runtime's `fetch` rejects on transport failure, but an HTTP error status still resolves to a `Response`. Check `response.ok` before reading or parsing data:

```
const response = await fetch(url);

if (!response.ok) {

  throw new Error(`Request failed: ${response.status} ${response.statusText}`);

}

const data = await response.arrayBuffer();
```

If a service returns a JSON or XML error envelope with a successful status, use its source/loader's documented error handling or validate the envelope yourself. Error bodies have no universal format; avoid presenting arbitrary server HTML as application UI. See [authentication](https://loaders.gl/next/docs/developer-guide/authentication.md) for provider response handling and refresh behavior.
