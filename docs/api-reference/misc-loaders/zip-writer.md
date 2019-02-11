# ZipWriter

Encodes a filemap into a Zip Archive. Returns an `ArrayBuffer` that is a valid Zip Archive and can be written to file.

| Loader           | Characteristic |
| ---              | ---            |
| File Extension   | `.zip`         |
| File Format      | Binary         |
| Category         | Archive        |
| Data             | "File Map"     |
| Parser Type      | Asynchronous   |
| Worker Thread    | No - TBD       |
| Streaming        | No - TBD       |


## Usage


```
import {encodeFile} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const FILEMAP = {
	filename1: arrayBuffer1,
	'directory/filename2': ...
};

encodeFile(FILE_MAP, ZipWriter)
	.then(arrayBuffer => writeFile(zipFileName, arrayBuffer))
	.catch(error => ...);
});
```


## Input

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either `ArrayBuffer` or `String`).


## Output


## Options

Options are forwarded to [JSZip.generateAsync](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html), however type is always set to `arraybuffer` to ensure compatibility with writer driver functions in `@loaders.gl/core`.


## Attributions

This writer object is a wrapper for the [JSZip module](https://stuk.github.io/jszip/). JSZip has extensive documentation on options (and more functionality than this writer object can expose).
