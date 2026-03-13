# ZipWriter

Encodes a filemap into a Zip Archive. Returns an `ArrayBuffer` that is a valid Zip Archive and can be written to file.

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Format    | [ZIP Archive](/docs/modules/zip/formats/zip) |
| Data Format    | "File Map"                                   |
| File Extension | `.zip`                                       |
| File Type      | Binary                                       |
| Encoder Type   | Asynchronous                                 |
| Worker Thread  | No                                           |
| Streaming      | No                                           |

## Usage

```typescript
import {encode, writeFile} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const FILE_MAP = {
  filename1: arrayBuffer1,
  'directory/filename2': arrayBuffer2,
  'directory/nested/': ''
};

const arrayBuffer = await encode(FILE_MAP, ZipWriter);
writeFile(zipFileName, arrayBuffer);
```

## File Format

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each subfile (either `ArrayBuffer` or `String`).

- Nested keys such as `folder/file.txt` are written as file paths inside the archive.
- Keys ending with `/` are written as directory entries.
- Parent directory entries can also be emitted for nested file keys.

## Options

Archive output always uses `type: 'arraybuffer'`.

| Option                      | From                                                                                  | Type                                   | Default   | Description                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `zip.onUpdate`              |                                                                                       | `(metadata: {percent: number}) => void` | `() => {}` | Receives progress updates while the archive is generated.                                            |
| `zip.createFolders`         | [![Website shields.io](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)](http://shields.io) | `boolean`                              | `false`   | Creates parent directory entries for nested file keys such as `folder/sub/file.txt`.                |
| `jszip`                     |                                                                                       | `object`                               | `{}`      | Passes JSZip file and archive generation options through to the underlying writer as an escape hatch. |

Explicit slash-suffixed keys are written as directory entries whether or not `zip.createFolders` is enabled.
