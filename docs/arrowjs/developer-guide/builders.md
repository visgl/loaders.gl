# Building columns and tables

Many JavaScript application may only need to be able to load and iterate of the data in existing Apache Arrow files creating outside of JavaScript.

However a JS application may also want to create its own Arrow tables from scratch.

For this situation, Apache Arrow JS provides the `makeBuilder()` function that returns `Builder` instances that can be used to build columns of specific data types.

However, creating arrow-compatible binary data columns for complex, potentially nullable data types can be quite tricky.

```ts
import {Builder, Utf8} from 'apache-arrow';

const utf8Builder = makeBuilder({
  type: new Utf8(),
  nullValues: [null, 'n/a']
});

utf8Builder.append('hello').append('n/a').append('world').append(null);

const utf8Vector = utf8Builder.finish().toVector();

console.log(utf8Vector.toJSON());
// > ["hello", null, "world", null]
```

One way to build a table with multiple columns is to create an arrow `Struct` field type using the fields in the table's schema,
and then create a `Data` object using that `Field` object and the data

```ts
function buildTable(arrowSchema: arrow.Schema, rows: any[][]) {
  const arrowBuilders = arrowSchema.fields.map((field) =>
    arrow.makeBuilder({type: field.type, nullValues: [null]})
  );

  for (const row of rows) {
    for (let i = 0; i < arrowBuilders.length; i++) {
      arrowBuilders[i].append(row[i]);
    }
  }

  const vectors = arrowBuilders.map((builder) => builder.finish().toVector());
  return arrow.Table.new(
    Object.fromEntries(vectors.map((vector, index) => [arrowSchema.fields[index].name, vector]))
  );
}
```
