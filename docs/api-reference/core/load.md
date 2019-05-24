# load

The `load` function can be used with any _loader object_. They takes a `url` and one or more _loader objects_, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

### load(url : String | File, loaders : Object | Object[][, options : object]) : Promise.Response

### load(url : String | File [, options : Object]) : Promise.Response

The `load` function is used to load and parse data with a specific _loader object_. An array of loader objects can be provided, in which case `load` will attempt to autodetect which loader is appropriate for the file.

The `loaders` parameter can also be omitted, in which case any _loader objects_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

- `url` - Can be a string, either a data url or a request url, or in Node.js, a file name, or in the browser, a File object. Or any format that could be accepted by [`parse`](https://github.com/uber-web/loaders.gl/blob/master/docs/api-reference/core/parse.md#parsedata--arraybuffer--string--options--object--url--string--promise). If `url` is not a `string`, will call `parse` directly.
- `data` - loaded data, either in binary or text format.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options` - optional, contains both options for the read process and options for the loader (see documentation of the specific loader).
- `options.dataType`=`arraybuffer` - By default reads as binary. Set to 'text' to read as text.

Returns:

- Return value depends on the _loader object_ category

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.
- `load` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.
