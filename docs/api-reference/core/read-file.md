# File Utilities

A set of small file load and save utilities that work consistently across browser main thread, worker threads and node.

## Usage

```
import {loadFile} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

loadFile(url, OBJLoader).then(data => {
  // Application code here
  ...
});
```

## Functions

### fetchFile(url : String [, options : Object]) : Promise<Response>

A version of [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Response) that can be used in both the browser and Node.js.

Returns:

- In the browser `fetchFile` will delegate to fetch after resolving the URL.
- In node.js a mock `Response` object will be returned.

### readFile(url : String [, options : Object]) : Promise<ArrayBuffer>

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### readFileSync(url : String [, options : Object]) : ArrayBuffer

> Only works on Node.js or using data URLs.

Reads the raw data from a "file" synchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### createReadStream(url : String, options : Object) : ReadableStream

Attempts to creates a stream to read from the provided URI. Just like `readFile`, this function may call out to different underlying APIs (`fs`, `http`, `fetch`, ...) depending on URI and which platform the application is running on.

- `url` - Any path prefix set by `setPathPrefix` will be appended to relative urls, and any matching aliases will be resolved.

Node.js file URL options (see [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)):

- `options.highWaterMark` (Number) Default: 64K (64 \* 1024) - Determines the "chunk size" of data read from the file.

### getStreamIterator(stream : Stream) : AsyncIterator

Returns an async iterator that can be used to read chunks of data from the stream (or write chunks of data to the stream, in case of writable streams).

Works on both Node.js 8+ and browser streams.

## Remarks

- `fetchFile` is intended to be a small (in terms of bundle size) function to help applications work with files in a portable way. The `Response` object returned on Node.js does not implement all the functionality the browser does. If you run into the need
- In fact, the use of any of the file utilities including `readFile` and `readFileAsync` functions with other loaders.gl functions is entirely optional. loader objects can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.
- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
- The stream utilities are intended to be small optional helpers that facilitate writing platform independent code that works with streams. This can be valuable as JavaScript Stream APIs are still maturing and there are still significant differences between platforms. However, streams and iterators created directly using platform specific APIs can be used as parameters to loaders.gl functions whenever a stream is expected, allowing the application to take full control when desired.
