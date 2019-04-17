# Row

A `Row` is an Object that retrieves each value at a certain index across a collection of child Vectors. Rows are returned from the `get()` function of the nested `StructVector` and `MapVector`, as well as `RecordBatch` and `Table`.

A `Row` defines read-only accessors for the indices and (if applicable) names of the child Vectors. For example, given a `StructVector` with the following schema:

```ts
const children = [
    Int32Vector.from([0, 1]),
    Utf8Vector.from(['foo', 'bar'])
];

const type = new Struct<{ id: Int32, value: Utf8 }>([
    new Field('id', children[0].type),
    new Field('value', children[1].type)
]);

const vector = new StructVector(Data.Struct(type, 0, 2, 0, null, children));

const row = vector.get(1);

assert((row[0] ===   1  ) && (row.id    === row[0]));
assert((row[1] === 'bar') && (row.value === row[1]));
```

`Row` implements the Iterator interface, enumerating each value in order of the child vectors list.

Notes:

- If the Row's parent type is a `Struct`, `Object.getOwnPropertyNames(row)` returns the child vector indices.
- If the Row's parent type is a `Map`, `Object.getOwnPropertyNames(row)` returns the child vector field names, as defined by the `children` Fields list of the `Map` instance.

## Methods

### [key: string]: T[keyof T]['TValue']
### [kParent]: MapVector<T> | StructVector<T>
### [kRowIndex]: number
### [kLength]: number (readonly)
### [Symbol.iterator](): IterableIterator<T[keyof T]["TValue"]>
### get(key: K): T[K]["TValue"]

Returns the value at the supplied `key`, where `key` is either the integer index of the set of child vectors, or the name of a child Vector

### toJSON(): any
### toString(): any
