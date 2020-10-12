# RFC: Support for multi-file loading in loaders.gl

- **Authors**: Ib Green
- **Date**: Jul 2019
- **Status**: Draft

## Abstract

This RFC explores the idea of loaders.gl defining a few simple file system "interfaces" allowing things like lists of dropped files, zip file archives, the node file system as well as external cloud storage systems to be accessed using a common API.

## Idea

- Some file formats effectively represent virtual file systems (e.g. zip files, tar files, some media formats)
- a list of dropped files in the browser, a dropbox loader) can be treated as a small file system, allowing a "multi-file" loader to load other files in the same "directory"
- a number of cloud providers have JavaScript SDKs that provide access to their remote file systems.

Loaders that load sub-files may need to load additional files from the same source as the main file. Such loaders include:

- shape files
- glTF
- 3d tiles
- ...

### Proposal: File System API

Depending on its capabilities of the underlying libraries, different interfaces would be implemented by each loaders.gl file system. Each file system can implement a different subset of interfaces though all need to implement the Streaming API.

- **Streaming API** (minimal, all) - A streaming file system would just expose a `fetch` function that would resolve relative urls within the local file system, and delegate non-relative URLs to the "global" fetch.
- **Random Access API** (limited) - This allows for `open`, `close` and `read(offset, length)` and allows for file content to be read in any order. Supported on e.g. Node `fs` and `File` objects.
- **Directory API** (common) - This allows for `readdir`, `stat` etc and is supported by many file systems but not by raw HTTP/HTTPS connections.
- **Cloud Storage API** (special purpose) - This can provide a set of additional APIs common to cloud storage solutions - making files public, creating signed URLs etc.

With the exception of the mandatory `fetch` function, the remaing functions in these interfaces are modelled after the (promisified) `fs` API from Node.js, wherever that makes sense. The function signatures are not always exact matches but typically very close.

### Proposal: fetch "passthrough"

A file system containing only a few files can let the app resolve local files, however the code fetching from the file sytem may still be references to non-local files. Because of this,
global urls should be redirected to normal `fetch`.

## Longer Term Proposals

### Proposal: @loaders.gl/filesystems module

The idea is to rovide Node `fs` style API encapsulation for a number of cloud file systems such as Dropbox, Google Drive, Google Cloud Storage, AWS S3 etc.

Installation and selection of dependencies could be kept out of this module, and left to the application, by requiring each file system constructor to take a constructed object from the corresponding API.

The value of this module would be to collect the already growing number of such wrappers in a single place, ensure they follow a common API, and make them interoperable with loaders.gl filesystem and multi-file loading functions.

Existing code: Wrappers for dropbox, google drive (open PR) and aws (open PR) exist in kepler.gl, google cloud storage is also available.

### Proposal: File System Registration

Some file systems like Google Storage and AWS S3 could be registered globally with URL schemes like `gs://bucket/file` etc and loaders.gl core functions could automatically access such paths.

This would further strengthen loaders.gl support for backend Node.js server use cases, where accessing cloud storage and papering over differences between different cloud storage APIs are very common.

TODO: Investigate if such URL schemes are already supported through other means.

## Open Issues

### Login

File systems like Dropbox and Google Drive require login and getting that working is often a big part of the effort in integrating such libraries. It is an open question how much login support the `@loaders.gl/filesystems` module would provide for these file systems.

### Testability

One of the biggest issues (and arguments against adding file system support to loaders.gl) is that it is not possible to test many of the proposed file systems in the current CI and test infrastructure. Dropbox and Google Drive require user logins, and Cloud Storage and S3 require running virtual machines in those respective clouds.

The risk for regressions and the difficulty of easily debugging issues when they arise need to be considered.
