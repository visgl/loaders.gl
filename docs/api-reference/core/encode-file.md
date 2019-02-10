# encodeFile

> Needs update

## Functions

### encodeFile(fileData : ArrayBuffer | String, writer : Object | Array [, options : Object [, url : String]]) : Promise<Any>

Encodes data asynchronously using the provided writer.

* `data` - loaded data, either in binary or text format.
* `writer` - can be a single writer or an array of writers.
* `options` - optional, options for the writer (see documentation of the specific writer).
* `url` - optional, assists in the autoselection of a writer if multiple writers are supplied to `writer`.

* `options.log`=`console` Any object with methods `log`, `info`, `warn` and `error`. By default set to `console`. Setting log to `null` will turn off logging.


### encodeFileSync(fileData : ArrayBuffer | String, writer : Object | Array, [, options : Object [, url : String]]) : any

Encodes data synchronously using the provided writer, if possible. If not, returns `null`, in which case asynchronous loading is  required.

* `data` - loaded data, either in binary or text format.
* `writer` - can be a single writer or an array of writers.
* `options` - optional, options for the writer (see documentation of the specific writer).
* `url` - optional, assists in the autoselection of a writer if multiple writers are supplied to `writer`.

