---
title: ExcelLoader
description: Load worksheets into row tables or Apache Arrow tables from XLS, XLSB, and XLSX files.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Excel API · table loader"
  title="Bring worksheets into the same table path."
  description="ExcelLoader reads XLS, XLSB, and XLSX worksheets and returns either row-oriented data or an Arrow-backed table. Choose the shape that matches the next processing or rendering step."
  tone="cyan"
  meta={['XLS / XLSB / XLSX', 'Object rows or Arrow', 'Non-streaming']}
  links={[
    {label: 'Excel module', to: '/docs/modules/excel'},
    {label: 'Table category', to: '/docs/specifications/category-table'},
    {label: 'Apache Arrow guide', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The worksheet path"
  title="Choose rows for convenience or columns for processing."
  description="ExcelLoader keeps worksheet selection and output representation explicit. Object rows are convenient for application code; Arrow output is a better boundary when typed columns will feed scans, transforms, or writers."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Excel workbook with one or more worksheets'},
    {label: 'Worksheet', value: 'Select a sheet or use the first sheet by default'},
    {label: 'Output', value: 'ObjectRowTable or ArrowTable'},
    {label: 'Boundary', value: 'Non-streaming loader backed by SheetJS'}
  ]}
/>

<ReferenceBoundary
  title="ExcelLoader reference"
  description="The sections below document supported file types, output shapes, worksheet selection, options, and the SheetJS implementation boundary."
  tone="cyan"
/>

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
