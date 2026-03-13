# @loaders.gl/zip

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders and writers for the Zip Archive format.

For documentation please visit the [website](https://loaders.gl).

## ZipWriter options

- `options.zip.onUpdate` (`(metadata: {percent: number}) => void`)
  - Receives progress updates while the archive is generated.
- `options.zip.createFolders` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" /> (`boolean`, default: `false`)
  - Creates parent directory entries for nested file keys such as `folder/sub/file.txt`.
  - Directory keys that already end with `/` are written as directory entries whether or not this option is enabled.
- `options.jszip`
  - Passes JSZip file and archive generation options through to the underlying writer.
