# fetchFile

The `fetchFile()` function is an alternative to the built-in 
[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function. 
`fetchFile` provides additional functionality to support Node.js and testing use cases:

- load from local file system under Node.js
- path prefix resolution
- alias resolution

```typescript
fetchFile(url: string | Blob, options?: RequestInit) : Promise<Response>
```

A wrapper around the platform  function with some additions:


Returns:

- A promise that resolves into a fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object
  - `headers`: `Headers` - A [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object.
  - `arrayBuffer()`: Promise.ArrayBuffer`- Loads the file as an`ArrayBuffer`.
  - `text()`: Promise.String` - Loads the file and decodes it into text.
  - `json()`: Promise.String` - Loads the file and decodes it into JSON.
  - `body` : ReadableStream` - A stream that can be used to incrementally read the contents of the file.

:::info
Use of `fetchFile` is optional. loaders.gl `parse()` function can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.
:::

## Node.js local file system support

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `fetchFile()` function supports fetching data from the local file system under Node.js.

`fetchFile` will delegate any url that starts with `http://` `https://` or `data://`
to the built-in `fetch` function. Other URLs will be interpreted as local files.

:::caution
loaders.gl v4.0+ applications no longer need to install the `@loaders.gl/polyfills` 
module to get `fetch` support under Node.js v18+.
:::

## Path prefix resolution

`fetchFile()` injects any prefix set by the `setPathPrefix()` API. 
Note that the path prefix mechanism is mainly intended to help small example applications 
to load data from the right place. It is not intended to support general application use cases, so use sparingly.

## Alias resolution

`fetchFile()` also resolves any aliases set by the `_addAliases` function. This internal
functionality is mainly intended for and used by loaders.gl own test cases, to allow paths
to test data file to be specified in terms of which loaders.gl module they are located in.

## Usage

Use the `fetchFile` function as follows:

```typescript
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

```typescript
import {fetchFile, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const data = await parse(fetchFile(url), OBJLoader);
```

Note that if you don't need the extra features in `fetchFile`, you can just use the browsers built-in `fetch` method.

```typescript
import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const data = await parse(fetch(url), OBJLoader);
```

## Functions


## Remarks

- `fetch` is supported in Node.js from v18+.
- For `string` URLs - `fetchFile` will delegate to `fetch` after resolving the URL.
- For `File`/`Blob` - a `Response` object will be returned. Any `RequestInit` options are ignored in this case.
- `Response.headers` (`Content-Length` and `Content-Type`) are populated (on a best effort basis for `File`, `Blob` and under Node.js).
- Supports `setPathPrefix`: If path prefix has been set, it will be appended if `url` is relative (e.g. does not start with a `/`).
- Supports `File` and `Blob` objects on the browser (and returns "mock" fetch response objects).
