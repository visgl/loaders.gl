# RFC: Support for multi-file loading in loaders.gl

- **Authors**: Ib Green
- **Date**: Jul 2019
- **Status**: Draft

## Abstract

This RFC outlines how to add the capability to

## Proposals

- Extend loader functions to optionally accept lists of files (or file systems).
- Extend loader objects to be able to return a file system (e.g. Zip and Tar loaders could have a `parseAsFileSystem` method)
- Overridable `fetch` could be leveraged to support allow loaders to access "sibling" files in such file systems.

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
