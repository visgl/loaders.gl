# Types and Vectors

## Overview

### Dictionary Arrays

The Dictionary type is a special array type that is similar to a factor in R or a pandas.Categorical in Python. It enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. This is particularly often used with strings to save memory and improve performance.


### BoolVector

### BinaryVector

### FloatVector<T extends Float = Float> extends BaseVector<T>

### Float16Vector extends FloatVector<Float16> {}
### Float32Vector extends FloatVector<Float32> {}
### Float64Vector extends FloatVector<Float64> {}


## IntVector

### Int8Vector extends IntVector<Int8>
### Int16Vector extends IntVector<Int16>
### Int32Vector extends IntVector<Int32>
### Int64Vector extends IntVector<Int64>
### Uint8Vector extends IntVector<Uint8>
### Uint16Vector extends IntVector<Uint16>
### Uint32Vector extends IntVector<Uint32>
### Uint64Vector extends IntVector<Uint64>

## DateVector

### DateDayVector
### DateMillisecondVector


