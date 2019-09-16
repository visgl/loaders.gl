# writeFile

A file save utilities that (attempts to) work consistently across browser and node.

## Usage

```js
import {writeFile} from '@loaders.gl/core';
import {DracoWriter} from '@loaders.gl/draco';

await writeFile(url, DracoWriter);
```

## Functions

### writeFile(url : String [, options : Object]) : Promise.ArrayBuffer

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### writeFileSync(url : String [, options : Object]) : ArrayBuffer

> Only works on Node.js or using data URLs.

Reads the raw data from a "file" synchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

## Remarks

- The use of the loaders.gl `writeFile` and `writeFileAsync` functions is optional, loaders.gl loaders can be used with any data loaded via any mechanism the application prefers, e.g. `fetch`, `XMLHttpRequest` etc.
- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
