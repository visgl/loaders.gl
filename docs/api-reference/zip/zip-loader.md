# ZipLoader

Decodes a Zip Archive into a file map.

| Loader         | Characteristic |
| -------------- | -------------- |
| File Extension | `.zip`         |
| File Format    | Binary         |
| Input Format   | [ZIP Archive](https://en.wikipedia.org/wiki/Zip_\(file_format\))   |
| Output Format  | "File Map"     |
| Decoder Type   | Asynchronous   |
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

## Output Format

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either `ArrayBuffer` or `String`).

## Options

Options are forwarded to [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html).
