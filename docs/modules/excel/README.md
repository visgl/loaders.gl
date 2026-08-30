---
title: Excel
description: Load Excel workbooks into loaders.gl table data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Excel module"
  title="Bring workbook sheets into a table pipeline."
  description="`@loaders.gl/excel` reads Excel workbooks and exposes their sheet data through the loaders.gl table conventions. It is a boundary adapter for applications that should not need to understand workbook internals."
  tone="mint"
  meta={['Excel workbooks', 'Table data', 'Browser and Node.js']}
  links={[
    {label: 'Excel loader', to: '/docs/modules/excel/api-reference/excel-loader'},
    {label: 'Table category', to: '/docs/specifications/category-table'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The workbook path"
  title="Open a workbook. Choose a sheet. Process table data."
  description="The loader hides workbook parsing behind a familiar loaders.gl result. Downstream table code can remain separate from the original spreadsheet container."
  tone="mint"
  items={[
    {label: 'Input', value: 'XLSX and supported Excel workbook data'},
    {label: 'Discover', value: 'Workbook and sheet structure'},
    {label: 'Select', value: 'Sheet and loader-specific options'},
    {label: 'Output', value: 'Loaders.gl table data'}
  ]}
/>

<ReferenceBoundary
  title="Excel loader details"
  description="The reference below covers installation, the loader entry point, workbook handling, and the table category used by the result."
  tone="mint"
/>

The `@loaders.gl/excel` module handles tabular data stored in the Excel file format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/excel
```

## Loaders and Writers

| Loader | Description |
| ------ | ----------- |
| [`ExcelLoader`](/docs/modules/excel/api-reference/excel-loader#excelloader) | Loads Excel workbooks as loaders.gl tables. |

## Additional APIs

See table category.
