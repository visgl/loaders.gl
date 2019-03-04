# Data


## Fields

readonly type: T;

readonly length: Number;

readonly offset: Number;

readonly stride: Number;

readonly childData: Data[];

readonly values: Buffers<T>[BufferType.DATA];

readonly typeIds: Buffers<T>[BufferType.TYPE];

readonly nullBitmap: Buffers<T>[BufferType.VALIDITY];

readonly valueOffsets: Buffers<T>[BufferType.OFFSET];

readonly ArrayType: any;

readonly typeId: T['TType'];

readonly buffers: Buffers<T>;

readonly nullCount: Number;


## Static Methods

Convenience methods for creating Data instances for each of the Arrow Vector types.

### Data.Null<T extends Null>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer) : Data

### Data.Int<T extends Int>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Dictionary<T extends Dictionary>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Float<T extends Float>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Bool<T extends Bool>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Decimal<T extends Decimal>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Date<T extends Date_>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Time<T extends Time>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Timestamp<T extends Timestamp>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Interval<T extends Interval>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.FixedSizeBinary<T extends FixedSizeBinary>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, data: DataBuffer<T>) : Data

### Data.Binary<T extends Binary>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data

### Data.Utf8<T extends Utf8>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, data: Uint8Array) : Data

### Data.List<T extends List>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, valueOffsets: ValueOffsetsBuffer, child: Data<T['valueType']> | Vector<T['valueType']>) : Data

### Data.FixedSizeList<T extends FixedSizeList>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, child: Data | Vector) : Data

### Data.Struct<T extends Struct>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: (Data | Vector)[]) : Data

### Data.Map<T extends Map_>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, children: (Data | Vector)[]) : Data

### Data.Union<T extends SparseUnion>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, children: (Data | Vector)[]) : Data

### Data.Union<T extends DenseUnion>(type: T, offset: Number, length: Number, nullCount: Number, nullBitmap: NullBuffer, typeIds: TypeIdsBuffer, valueOffsets: ValueOffsetsBuffer, children: (Data | Vector)[]) : Data
}

## Methods


### constructor(type: T, offset: Number, length: Number, nullCount?: Number, buffers?: Partial<Buffers<T>> | Data<T>, childData?: (Data | Vector)[]);

### clone(type: DataType, offset?: Number, length?: Number, nullCount?: Number, buffers?: Buffers<R>, childData?: (Data | Vector)[]) : Data;

### slice(offset: Number, length: Number) : Data


