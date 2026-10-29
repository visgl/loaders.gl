Arrow JavaScript · construction

# Build typed columns as values arrive.

Builders are useful when an application owns the input rows or needs to assemble a vector incrementally. Declare the Arrow type up front, append values, then finish a compact vector or table.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Builder API](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)[Table API](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

The builder loop

## Declare, append, finish.

Builders collect values into Arrow buffers and validity state. They are a good fit for generated records, row-oriented inputs, and small adapters between application objects and columnar tables.

01

Declare

Choose a logical Arrow type and null policy

02

Append

Add values in arrival order

03

Finish

Seal buffers into a vector

04

Assemble

Combine vectors into a table with named fields

Detailed guide

## Builder details

The examples below cover primitive builders, row-to-column assembly, null values, and the point where a builder should give way to a streaming writer.

# Building columns and tables

Many JavaScript applications only need to load and iterate over data in existing Arrow files.

Complex applications may also need to create their own Arrow tables.

For this, Apache Arrow JS provides `makeBuilder()` to produce type-specific `Builder` instances.

```
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

### Building a table from row arrays[​](#building-a-table-from-row-arrays "Direct link to Building a table from row arrays")

```
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
