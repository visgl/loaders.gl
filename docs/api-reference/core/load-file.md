# loadFile

`loadFile` and `loadFileSync` function can be used with any *loader object*. They takes a `url` and one or more *loader objects*, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

### loadFile(url : String | File, loaders : Object | Object[] [, options : Object]) : Promise<Response>
### loadFile(url : String | File [, options : Object]) : Promise<Response>

The `loadFile` function is used to load and parse data with a specific *loader object*. An array of loader objects can be provided, in which case `loadFile` will attempt to autodetect which loader is appropriate for the file.

The `loaders` parameter can also be ommitted, in which case any *loader objects* previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

- `url` - Can be a string, either a data url or a request url, or in Node.js, a file name, or in the browser, a File object.
- `data` - loaded data, either in binary or text format.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options` - optional, contains both options for the read process and options for the loader (see documentation of the specific loader).
- `options.dataType`=`arraybuffer` - By default reads as binary. Set to 'text' to read as text.

Returns:

- Return value depends on the *loader object* category

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.
- `loadFile` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

### loadFileSync(url : String [, options : Object]) : ArrayBuffer | String

Similar to `loadFile` except loads and parses data synchronously.

Note that for `loadFileSync` to work, the `url` needs to be loadable synchronously _and_ the loader used must support synchronous parsing. Synchronous loading only works on data URLs or files in Node.js. In many cases, the asynchronous `loadFile` is more appropriate.
