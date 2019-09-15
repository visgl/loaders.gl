# fetchFile

The `fetchFile` function is a wrapper around `fetch` which provides support for path prefixes and some additional loading capabilities.

## Usage

Use the `fetchFile` function as follows:

```js
import {fetchFile} from '@loaders.gl/core';

const response = await fetchFile(url);

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

### fetchFile(url : String [, options : Object]) : Promise.Response

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

Options:

Under Node.js, options include (see [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)):

- `options.highWaterMark` (Number) Default: 64K (64 \* 1024) - Determines the "chunk size" of data read from the file.

### readFileSync(url : String [, options : Object]) : ArrayBuffer | String

> This function only works on Node.js or using data URLs.

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

## Remarks

- `fetchFile` will delegate to `fetch` after resolving the URL.
- For some data sources such as node.js and `File`/`Blob` objects a mock `Response` object will be returned, and not all fields/members may be implemented.
- When possible, `Content-Length` and `Content-Type` `headers` are also populated for non-request data sources including `File`, `Blob` and Node.js files.
- `fetchFile` is intended to be a small (in terms of bundle size) function to help applications work with files in a portable way. The `Response` object returned on Node.js does not implement all the functionality the browser does. If you run into the need
- In fact, the use of any of the file utilities including `readFile` and `readFileAsync` functions with other loaders.gl functions is entirely optional. loader objects can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.
- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
- The stream utilities are intended to be small optional helpers that facilitate writing platform independent code that works with streams. This can be valuable as JavaScript Stream APIs are still maturing and there are still significant differences between platforms. However, streams and iterators created directly using platform specific APIs can be used as parameters to loaders.gl functions whenever a stream is expected, allowing the application to take full control when desired.
