# load

The `load` function can be used with any _loader object_. They takes a `url` and one or more _loader objects_, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

### load(url : String | File, loaders : Object | Object[][, options : object]) : Promise.Response

### load(url : String | File [, options : Object]) : Promise.Response

The `load` function is used to load and parse data with a specific _loader object_. An array of loader objects can be provided, in which case `load` will attempt to autodetect which loader is appropriate for the file.

The `loaders` parameter can also be omitted, in which case any _loader objects_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

- `url` - Urls can be data urls (`data://`) or a request (`http://` or `https://`) urls, or a file name (Node.js only). Also accepts `File` or `Blob` object (Browser only). Can also accept any format that is accepted by [`parse`](https://github.com/visgl/loaders.gl/blob/master/docs/api-reference/core/parse.md), with the exception of strings that are interpreted as urls.
- `loaders` - can be a single loader or an array of loaders. If single loader is provided, will force to use it. If ommitted, will use the list of pre-registered loaders (see `registerLoaders`)
- `options` - optional, contains both options for the read process and options for the loader (see documentation of the specific loader).

Returns:

- Return value depends on the _loader category_.

Notes:

- If `url` is not a `string`, `load` will call `parse` directly.
- Any path prefix set by `setPathPrefix` will be appended to relative urls.
- `load` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.
- If `@loaders.gl/polyfills` is installed, `load` will work under Node.js as well.

## Options

A loader object, that can contain a mix of options defined by:

- any loader(s) being used
- the `parse` function

In addition to the following options

| Option             | Type   | Default       | Description                                                      |
| ------------------ | ------ | ------------- | ---------------------------------------------------------------- |
| `options.dataType` | string | `arraybuffer` | Default depends on loader object. Set to 'text' to read as text. |
