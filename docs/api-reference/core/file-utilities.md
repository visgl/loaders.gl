# File Utilities

A set of file load and save utilities that (attempt to) work consistently across browser and node.


## Functions

### readFile(url : String [, options : Object]) : Promise<ArrayBuffer>

Reads the raw data from a file asynchronously.

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### readFileSync(url : String [, options : Object]) : ArrayBuffer

> Only works on Node.js or using data URLs.

Reads the raw data from a "file" synchronously.

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### parseFile(fileData : ArrayBuffer | String, loader : Object [, options : Object]) : Promise<Any>

Parses data asynchronously using the provided loader.


### parseFileSync(fileData : ArrayBuffer | String, loader : Object, [, options : Object]) : any

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous loading is  required.


### loadFile(url : String [, options : Object]) : Promise<ArrayBuffer>

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### loadFileSync(url : String [, options : Object]) : Promise<ArrayBuffer>

> Only works on Node.js or using data URLs.

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### loadImage(url : String [, options : Object]) : Image / HTMLImageElement

<p class="badges">
   <img src="https://img.shields.io/badge/browser-only-red.svg?style=flat-square" alt="browser only" />
</p>

This is a minimal basic image loading function that only works in the browser main threaqd. For image loading and writing that works across both browser and node, refer to the `@loaders.gl/images` module.

`options.crossOrigin` - Provides control of the requests cross origin field.

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### setPathPrefix(prefix : String)

This sets a path prefix that is automatically prepended to relative path names provided to load functions.


### getPathPrefix() : String

Returns the current path prefix set by `setPathPrefix`.


## Remarks

* The use of the loaders.gl `readFile` and `readFileAsync` functions is optional, loaders.gl loaders can be used with any data loaded via any mechanism the application prefers, e.g. `fetch`, `XMLHttpRequest` etc.
* The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
