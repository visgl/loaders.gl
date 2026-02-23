# @loaders.gl/zip

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders and writers for the Zip Archive format.

For documentation please visit the [website](https://loaders.gl).

## ZipWriter options

- `options.zip.onUpdate` (`(metadata: {percent: number}) => void`)
  - Forwarded to `JSZip.generateAsync` for progress updates.
- `options.zip.createDirectoryEntries` (`boolean`, default: `false`)
  - When true, directory entries are created for all parent paths in nested file keys (for example, `folder/sub/file.txt` creates `folder/` and `folder/sub/` entries).
  - Directory keys that already end with `/` are always written as directory entries regardless of this option.
- `options.jszip`
  - Passed through to JSZip for archive generation.
