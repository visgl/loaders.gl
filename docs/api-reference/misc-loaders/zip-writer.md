# ZipWriter

Encodes a filemap into a Zip Archive. Returns an `ArrayBuffer` that is a valid Zip Archive and can be written to file.

| Loader           | Characteristic |
| ---              | ---            |
| File Extension   | `.zip`         |
| File Type        | Binary         |
| File Format      | [Zip Format](https://en.wikipedia.org/wiki/Zip_(file_format)) |
| Category         | Archive        |
| Data             | "File Map"     |
| Parser Type      | Asynchronous   |
| Worker Thread    | No             |
| Streaming        | No             |


## Usage

```js
import {encodeFile, writeFile} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const FILEMAP = {
  filename1: arrayBuffer1,
  'directory/filename2': ...
};

const arrayBuffer = await encodeFile(FILE_MAP, ZipWriter)
writeFile(zipFileName, arrayBuffer);
```


## Input

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either `ArrayBuffer` or `String`).



## Options

Options are forwarded to [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html), however type is always set to `arraybuffer` to ensure compatibility with writer driver functions in `@loaders.gl/core`.


## Attributions

ZipWriter is a wrapper around the [JSZip module](https://stuk.github.io/jszip/). JSZip has extensive documentation on options (and more functionality than this writer object can expose).
