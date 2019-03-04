# Row

TBD - `Row` is returned from `Table.get()`?

## Methods

### [key: string]: T[keyof T]['TValue']
### [kParent]: MapVector<T> | StructVector<T>
### [kRowIndex]: number
### [kLength]: number (readonly)
### [Symbol.iterator](): IterableIterator<T[keyof T]["TValue"]>
### get(key: K): T[K]["TValue"]
### toJSON(): any
### toString(): any
