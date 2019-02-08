# parseFile


## Functions

### parseFile(fileData : ArrayBuffer | String, loader : Object | Array [, options : Object [, url : String]]) : Promise<Any>

Parses data asynchronously using the provided loader.

* `data` - loaded data, either in binary or text format.
* `loader` - can be a single loader or an array of loaders.
* `options` - optional, options for the loader (see documentation of the specific loader).
* `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

### parseFileSync(fileData : ArrayBuffer | String, loader : Object | Array, [, options : Object [, url : String]]) : any

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous loading is  required.

* `data` - loaded data, either in binary or text format.
* `loader` - can be a single loader or an array of loaders.
* `options` - optional, options for the loader (see documentation of the specific loader).
* `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.
