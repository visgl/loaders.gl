# loadFile

`loadFile` and `loadFileSync` function can be used with any loader. `loadFile` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.


## Functions


### loadFile(url : String | File, loader : Object [, options : Object]) : Promise<ArrayBuffer | String>

The `loadFile` function can be used with any loader.

`loadFile` takes a `url` and a loader object, checks what type of data that loader prefers to work on (e.g. text, JSON, binary, stream, ...), loads the data in the appropriate way, and passes it to the loader.

* `url` - Can be a string, either a data url or a request url, or in Node.js, a file name, or in the browser, a File object.
* `data` - loaded data, either in binary or text format.
* `loader` - can be a single loader or an array of loaders.
* `options` - optional, contains both options for the read process and options for the loader (see documentation of the specific loader).
* `options.dataType`=`arraybuffer` - By default reads as binary. Set to 'text' to read as text.

Returns:
* Return value depends on the category

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### loadFileSync(url : String [, options : Object]) : ArrayBuffer | String


Similar to `loadFile` except loads and parses data synchronously.

Note that for `loadFileSync` to work, the `url` needs to be loadable synchronously *and* the loader used must support synchronous parsing. Synchronous loading only works on data URLs or files in Node.js. In many cases, the asynchronous `loadFile` is more appropriate.
