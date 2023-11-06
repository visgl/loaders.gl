# Builders


 The `makeBuilder()` function creates a `Builder` instance that is set up to build 
 a columnar vector of the supplied `DataType`.
 
 A `Builder` is responsible for writing arbitrary JavaScript values
 to ArrayBuffers and/or child Builders according to the Arrow specification
 or each DataType, creating or resizing the underlying ArrayBuffers as necessary.
 
 The `Builder` for each Arrow `DataType` handles converting and appending
 values for a given `DataType`. 

 Once created, `Builder` instances support both appending values to the end
 of the `Builder`, and random-access writes to specific indices
 `builder.append(value)` is a convenience method for
 builder.set(builder.length, value)`). Appending or setting values beyond the
 uilder's current length may cause the builder to grow its underlying buffers
 r child Builders (if applicable) to accommodate the new values.
 
 After enough values have been written to a `Builder`, `builder.flush()`
 ill commit the values to the underlying ArrayBuffers (or child Builders). The
 nternal Builder state will be reset, and an instance of `Data<T>` is returned.
 lternatively, `builder.toVector()` will flush the `Builder` and return
 n instance of `Vector<T>` instead.
 
 When there are no more values to write, use `builder.finish()` to
 inalize the `Builder`. This does not reset the internal state, so it is
 ecessary to call `builder.flush()` or `toVector()` one last time
 f there are still values queued to be flushed.
 
 Note: calling `builder.finish()` is required when using a `DictionaryBuilder`,
 ecause this is when it flushes the values that have been enqueued in its internal
 ictionary's `Builder`, and creates the `dictionaryVector` for the `Dictionary` `DataType`.


 ## Usage

Creating a utf8 array 

 ```ts
 import { Builder, Utf8 } from 'apache-arrow';

 const utf8Builder = makeBuilder({
     type: new Utf8(),
     nullValues: [null, 'n/a']
 });

 utf8Builder
     .append('hello')
     .append('n/a')
     .append('world')
     .append(null);

 const utf8Vector = utf8Builder.finish().toVector();

 console.log(utf8Vector.toJSON());
 // > ["hello", null, "world", null]
 ```

## makeBuilder

```ts
function makeBuilder(options: BuilderOptions): Builder;
```

```ts
type BuilderOptions<T extends DataType = any, TNull = any> {
    type: T;
    nullValues?: TNull[] | ReadonlyArray<TNull> | null;
    children?: { [key: string]: BuilderOptions } | BuilderOptions[];
}
```

- `type` - the data type of the column. This can be an arbitrarily nested data type with children (`List`, `Struct` etc).
- `nullValues?` - The javascript values which will be considered null-values.
- `children?` - `BuilderOptions` for any nested columns.

- `type T` - The `DataType` of this `Builder`.
- `type TNull` - The type(s) of values which will be considered null-value sentinels.
  

## Builder

`makeBuilder()` returns `Builder` which is a base class for the various that Arrow JS builder subclasses that 
construct Arrow Vectors from JavaScript values.

