# Chunked

extends Vector

## Static Methods

### Chunked.flatten(...vectors: Vector<T>[]) : any[]
### Chunked.concat(...chunks: Vector<T>[]): Chunked

## Members

### get type()
### get length()
### get chunks()
### get typeId(): T['TType']
### get data(): Data
### get ArrayType()
### get numChildren()
### get stride()
### get nullCount()
### get indices(): ChunkedKeys<T> | null
### get dictionary(): ChunkedDict | null
### * [Symbol.iterator](): IterableIterator


## Methods

### constructor(type: T, chunks: Vector<T>[] = [], offsets = calculateOffsets(chunks))
### clone(chunks = this._chunks): Chunked
### concat(...others: Vector<T>[]): Chunked
### slice(begin?: number, end?: number): Chunked
### getChildAt(index: number): Chunked | null
### search(index: number): [number, number] | null;
### search(index: number, then?: SearchContinuation): ReturnType<N>;
### search(index: number, then?: SearchContinuation)
### isValid(index: number): boolean
### get(index: number): T['TValue'] | null
### set(index: number, value: T['TValue'] | null): void
### indexOf(element: T['TValue'], offset?: number): number
### toArray(): T['TArray']