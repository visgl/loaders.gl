# fetchFile

The `fetchFile` function is a wrapper around `fetch` which provides support for path prefixes and some additional loading capabilities.

## Usage

Use the `fetchFile` function as follows:

```js
import {fetchFile} from '@loaders.gl/core';

const response = await fetchFile(url);
// or supply any standard `RequestInit` options expected by `fetch`
const response = await fetchFile(url, {headers: {}});

// Now use standard browser Response APIs

// Note: headers are case-insensitive
const contentLength = response.headers.get('content-length');
const mimeType = response.headers.get('content-type');

const arrayBuffer = await response.arrayBuffer();
```

The `Response` object from `fetchFile` is usually passed to `parse` as follows:

```js
import {fetchFile, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const data = await parse(fetchFile(url), OBJLoader);
```

Note that if you don't need the extra features in `fetchFile`, you can just use the browsers built-in `fetch` method.

```js
import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const data = await parse(fetch(url), OBJLoader);
```

## Functions

### `fetchFile(url: string | Blob, options?: RequestInit) : Promise<Response>`

A wrapper around the platform [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function with some additions:

- Supports `setPathPrefix`: If path prefix has been set, it will be appended if `url` is relative (e.g. does not start with a `/`).
- Supports `File` and `Blob` objects on the browser (and returns "mock" fetch response objects).

Returns:

- A promise that resolves into a fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object, with the following methods/fields:
  - `headers`: `Headers` - A [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object.
  - `arrayBuffer()`: Promise.ArrayBuffer`- Loads the file as an`ArrayBuffer`.
  - `text()`: Promise.String` - Loads the file and decodes it into text.
  - `json()`: Promise.String` - Loads the file and decodes it into JSON.
  - `body` : ReadableStream` - A stream that can be used to incrementally read the contents of the file.

## Remarks

- For `string` URLs - `fetchFile` will delegate to `fetch` after resolving the URL.
- For `File`/`Blob` - a `Response` object will be returned. Any `RequestInit` options are ignored in this case.
- Under Node.js, `fetchFile` (and `fetch`) works and returns a polyfilled `Response` object if `@loaders.gl/polyfills` has been installed, and `RequestInit` options are used.
- `Response.headers` (`Content-Length` and `Content-Type`) are populated (on a best effort basis for `File`, `Blob` and under Node.js).
- Use of `fetchFile` is completely optional. loaders.gl can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.
- The `setPathPrefix()` mechanism is intended to help test cases to load data from the right place, but is not intended to support general application use cases, so use with care.
