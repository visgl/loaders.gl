# Stream Utilities

The stream utilities are intended to be small optional helpers that facilitate writing platform independent code that works with streams. This can be valuable as JavaScript Stream APIs are still maturing and there are still significant differences between platforms. However, streams and iterators created directly using platform specific APIs can be used as parameters to loaders.gl functions whenever a stream is expected, allowing the application to take full control when desired.

## Functions

### createReadStream(url : String, options : Object) : ReadableStream

Attempts to creates a stream to read from the provided URI. Just like `readFile`, this function may call out to different underlying APIs (`fs`, `http`, `fetch`, ...) depending on URI and which platform the application is running on.

- `url` - Any path prefix set by `setPathPrefix` will be appended to relative urls, and any matching aliases will be resolved.

Node.js file URL options (see [fs.createReadStream](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)):
- `options.highWaterMark` <integer> Default: 64K (64 * 1024) - Determines the "chunk size" of data read from the file.


### getStreamIterator(stream : Stream) : AsyncIterator

Returns an async iterator that can be used to read chunks of data from the stream (or write chunks of data to the stream, in case of writable streams).

Works on both Node.js 8+ and browser streams.
