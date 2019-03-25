# File Utilities

Small optional file reading utilities that work consistently across browser (both main thread and worker threads) as well as under Node. The main function is `fetchFile` which can be used as a slightly more featured/portable version of fetch.

## Usage

Use the `fetchFile` function as follows:

```js
import {fetchFile, parseFile} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

data = await parseFile(fetchFile(url), OBJLoader);
// Application code here
...
```

Note that if you don't care about Node.js compatibility, you can just use the browser's built-in `fetch` directly.

```js
import {parseFile} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

data = await parseFile(fetch(url), OBJLoader);
// Application code here
...
```

## Functions

### fetchFile(url : String [, options : Object]) : Promise<Response>

A version of [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Response) that:

- can be used in both the browser and Node.js.
- Supports `setPathPrefix`: If path prefix has been set, it will be appended if `url` is relative (e.g. does not start with a `/`).

Returns:

- A promise that resolves into a fetch `Response` object, with the following methods/fields:
  - `arrayBuffer() : Promise<ArrayBuffer>` - Loads the file as an `ArrayBuffer`.
  - `text() : Promise<String>` - Loads the file and decodes it into text.
  - `body : ReadableStream` - A stream that can be used to incrementally read the contents of the file.

Options:

Under Node.js, options include (see [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)):

- `options.highWaterMark` (Number) Default: 64K (64 \* 1024) - Determines the "chunk size" of data read from the file.

Remarks:

- In the browser `fetchFile` will delegate to fetch after resolving the URL.
- In node.js a mock `Response` object will be returned.

### readFileSync(url : String [, options : Object]) : ArrayBuffer | String

> This function only works on Node.js or using data URLs.

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

## Remarks

- `fetchFile` is intended to be a small (in terms of bundle size) function to help applications work with files in a portable way. The `Response` object returned on Node.js does not implement all the functionality the browser does. If you run into the need
- In fact, the use of any of the file utilities including `readFile` and `readFileAsync` functions with other loaders.gl functions is entirely optional. loader objects can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.
- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
- The stream utilities are intended to be small optional helpers that facilitate writing platform independent code that works with streams. This can be valuable as JavaScript Stream APIs are still maturing and there are still significant differences between platforms. However, streams and iterators created directly using platform specific APIs can be used as parameters to loaders.gl functions whenever a stream is expected, allowing the application to take full control when desired.
