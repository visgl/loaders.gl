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
