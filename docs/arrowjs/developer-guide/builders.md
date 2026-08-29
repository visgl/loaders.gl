---
title: Building Arrow columns and tables
description: Construct typed Arrow vectors and tables incrementally from JavaScript values.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · construction"
  title="Build typed columns as values arrive."
  description="Builders are useful when an application owns the input rows or needs to assemble a vector incrementally. Declare the Arrow type up front, append values, then finish a compact vector or table."
  tone="mint"
  meta={['makeBuilder()', 'Typed vectors', 'Null handling']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Builder API', to: '/docs/arrowjs/api-reference/builder'},
    {label: 'Table API', to: '/docs/arrowjs/api-reference/table'}
  ]}
/>

<DocOrientation
  eyebrow="The builder loop"
  title="Declare, append, finish."
  description="Builders collect values into Arrow buffers and validity state. They are a good fit for generated records, row-oriented inputs, and small adapters between application objects and columnar tables."
  tone="mint"
  items={[
    {label: 'Declare', value: 'Choose a logical Arrow type and null policy'},
    {label: 'Append', value: 'Add values in arrival order'},
    {label: 'Finish', value: 'Seal buffers into a vector'},
    {label: 'Assemble', value: 'Combine vectors into a table with named fields'}
  ]}
/>

<ReferenceBoundary
  title="Builder details"
  description="The examples below cover primitive builders, row-to-column assembly, null values, and the point where a builder should give way to a streaming writer."
  tone="mint"
/>

# Building columns and tables

Many JavaScript applications only need to load and iterate over data in existing Arrow files.

Complex applications may also need to create their own Arrow tables.

For this, Apache Arrow JS provides `makeBuilder()` to produce type-specific `Builder` instances.

```ts
import {makeBuilder, makeTable, Field, Struct, Utf8} from 'apache-arrow';

const utf8Builder = makeBuilder({
  type: new Utf8(),
  nullValues: [null, 'n/a']
});

utf8Builder.append('hello').append('n/a').append('world').append(null);

const utf8Vector = utf8Builder.finish().toVector();

console.log(utf8Vector.toJSON());
// > ["hello", null, "world", null]
```

### Building a table from row arrays

```ts
function buildTable(arrowSchema: any, rows: any[][]) {
  const arrowBuilders = arrowSchema.fields.map((field: any) =>
    makeBuilder({type: field.type, nullValues: [null]})
  );

  for (const row of rows) {
    for (let i = 0; i < arrowBuilders.length; i++) {
      arrowBuilders[i].append(row[i]);
    }
  }

  const vectors = arrowBuilders.map((builder: any) => builder.finish().toVector());
  return makeTable(
    Object.fromEntries(
      vectors.map((vector: any, index: number) => [arrowSchema.fields[index].name, vector])
    )
  );
}
```
