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
function buildTable(arrowSchema: arrow.Schema, const data: any[][]) {
  const arrowBuilders = this.arrowSchema.fields.map((field) => arrow.makeBuilder({type: field.type, [null]));

  // Application data
  const row = [column0value, column1Value, ...];

  for (let i = 0; i < this.arrowBuilders.length; i++) {
    arrowBuilders[i].append(row[i]);
  }

  const arrowDatas = arrowBuilders.map((builder) => builder.flush());
  const structField = new arrow.Struct(arrowSchema.fields);
  const arrowStructData = new arrow.Data(structField, 0, length, 0, undefined, arrowDatas);
  const arrowRecordBatch = new arrow.RecordBatch(arrowSchema, arrowStructData);
  const arrowTable = new arrow.Table([arrowRecordBatch])

  arrowBuilders.forEach((builder) => builder.finish());

  return arrowTable;
}
```
