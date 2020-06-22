# Overview

The `@loaders.gl/zip` module handles compressing and decompressing of the [ZIP](<https://en.wikipedia.org/wiki/Zip_(file_format)>) and [TAR](<https://en.wikipedia.org/wiki/Tar_(computing)>) format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/zip
```

## Attributions

ZipLoader is a wrapper around the [JSZip module](https://stuk.github.io/jszip/). JSZip has extensive documentation on options (and more functionality than this loader object can expose).

TarBuilder uses a modified version of [tar-js](https://github.com/beatgammit/tar-js), which is under MIT license, for tar archive construction.
