# Dictionary

A `Dictionary` stores index-to-value maps for dictionary encoded columns.


## Fields

### indices: `V<TKey>` readonly
### dictionary: `Vector<T>` readonly

## Static Methods

### Dictionary.from(values: Vector, indices: TKey, keys: `ArrayLike<number>` | TKey['TArray']) : Dictionary

## Methods

### constructor(data: Data)

### reverseLookup(value: T): number

### getKey(idx: number): TKey['TValue'] | null

### getValue(key: number): T['TValue'] | null

### setKey(idx: number, key: TKey['TValue'] | null): void

### setValue(key: number, value: T['TValue'] | null): void
