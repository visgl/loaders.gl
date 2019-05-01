# ZipLoader

Decodes a Zip Archive into a file map.

| Loader         | Characteristic |
| -------------- | -------------- |
| File Extension | `.zip`         |
| File Format    | Binary         |
| Category       | Archive        |
| Data           | "File Map"     |
| Parser Type    | Asynchronous   |
| Worker Thread  | No             |
| Streaming      | No             |

## Usage

```js
import {parse} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';

const fileMap = await parse(arrayBuffer, ZipLoader);
for (const fileName in FILE_MAP) {
  const fileData = fileMap[key];
  // Do something with the subfile
}
```

## Input

`ArrayBuffer` containing a valid Zip Archive

## Output

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either `ArrayBuffer` or `String`).

## Options

Options are forwarded to [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html).

## Attributions

ZipLoader is a wrapper around the [JSZip module](https://stuk.github.io/jszip/). JSZip has extensive documentation on options (and more functionality than this loader object can expose).
