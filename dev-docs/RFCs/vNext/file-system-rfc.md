# RFC: File System Support in loaders.gl

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft


## Idea

Some loaders can generate virtual file systems (e.g. zip files, a list of dropped files in the browser, a dropbox loader) where files can be loaded with local names from a non-traditional source. Overridable `fetch` could be extended to support this.

Loaders that load sub-files

- glTF
- 3d tiles
- shape files
- ...

These need to load additional files from the same source as the main file.

## API

A file system would expose a `fetch` function that would resolve relative urls with local

## Passthrough?

Global urls should be redirected to normal `fetch` (which also needs to be overridable?)
