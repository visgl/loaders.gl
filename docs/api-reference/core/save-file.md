# saveFile

> Needs update

`saveFile` and `saveFileSync` function can be used with any writer. `saveFile` takes a `url` and a writer object, checks what type of data that writer prefers to work on (e.g. text, JSON, binary, stream, ...), saves the data in the appropriate way, and passes it to the writer.

## Functions

### saveFile(url : String | File, writer : Object [, options : Object]) : Promise<ArrayBuffer | String>

The `saveFile` function can be used with any writer.

`saveFile` takes a `url` and a writer object, checks what type of data that writer prefers to work on (e.g. text, JSON, binary, stream, ...), saves the data in the appropriate way, and passes it to the writer.

- `url` - Can be a string, either a data url or a request url, or in Node.js, a file name, or in the browser, a File object.
- `data` - saveed data, either in binary or text format.
- `writer` - can be a single writer or an array of writers.
- `options` - optional, contains both options for the read process and options for the writer (see documentation of the specific writer).
- `options.dataType`=`arraybuffer` - By default reads as binary. Set to 'text' to read as text.

Returns:

- Return value depends on the category

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### saveFileSync(url : String [, options : Object]) : ArrayBuffer | String

Similar to `saveFile` except saves and parses data synchronously.

Note that for `saveFileSync` to work, the `url` needs to be saveable synchronously _and_ the writer used must support synchronous parsing. Synchronous saveing only works on data URLs or files in Node.js. In many cases, the asynchronous `saveFile` is more appropriate.
