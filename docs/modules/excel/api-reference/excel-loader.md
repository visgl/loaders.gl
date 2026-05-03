# Excel Loaders

Non-streaming table loaders for Excel files.

| Loader             | Output           | Use when                      |
| ------------------ | ---------------- | ----------------------------- |
| `ExcelLoader`      | `ObjectRowTable \| ArrowTable` | You want JavaScript row data or Arrow output. |

| Characteristic | Value                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.xls`, `.xlsb`, `.xlsx`                                                                                            |
| File Type      | Binary                                                                                                              |
| File Format    | [Excel](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xls/cd03cb5f-ca02-4934-a391-bb674cb8aa06) |
| Data Format    | [Tables](/docs/specifications/category-table)                                                                       |
| Supported APIs | `load`, `parse`                                                                                                     |

## ExcelLoader

`ExcelLoader` loads Excel worksheets as loaders.gl row tables by default. Set `excel.shape: 'arrow-table'` to request Apache Arrow output.

## Usage

```typescript
import {ExcelLoader} from '@loaders.gl/excel';
import {load} from '@loaders.gl/core';

const data = await load(url, ExcelLoader, {excel: options});
```

Load an Excel worksheet as a loaders.gl `ArrowTable` by setting `excel.shape: 'arrow-table'`.

```typescript
import {load} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/excel';

const table = await load(url, ExcelLoader, {
  excel: {
    ...options,
    shape: 'arrow-table'
  }
});

const zipCodeColumn = table.data.getChild('zip_code');
const firstZipCode = zipCodeColumn?.get(0);
```

## Options

| Option        | Type             | Default | Description                                       |
| ------------- | ---------------- | ------- | ------------------------------------------------- |
| `excel.sheet` | `string \| null` | `null`  | Which worksheet to load. Defaults to first sheet. |
| `excel.shape` | [![Website shields.io](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)](http://shields.io) `'object-row-table' \| 'arrow-table'` | `object-row-table` | Selects row-table output or Apache Arrow output. |

## Attribution

The Excel loaders wrap [`SheetJS`](https://github.com/SheetJS/sheetjs), which is Apache 2.0 licensed.
