// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import type {
  ParquetColumnChunk,
  ParquetField,
  ParquetRowGroup
} from '../../parquetjs/schema/declare';

/** Largest byte value copied inline to avoid TypedArray#set call overhead. */
const MAXIMUM_INLINE_BYTE_COPY_LENGTH = 7;

/** Primitive Arrow arrays emitted directly from decoded physical Parquet values. */
type NestedPrimitiveArrowArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

/** Selected decoded values and their Arrow validity information. */
type SelectedLeafValues = {
  length: number;
  firstValueIndex: number;
  valueCount: number;
  nullBitmap?: Uint8Array;
  nullCount: number;
};

/** Repeated-list offsets plus the selected primitive values contained by the lists. */
type SelectedRepeatedValues = SelectedLeafValues & {
  valueOffsets: Int32Array;
};

/**
 * Creates an Arrow List vector directly from a repeated Parquet primitive or repeated struct.
 * Returns undefined for shapes whose repetition tree is not supported by the direct path.
 */
export function createNestedArrowVector(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  rowGroup: ParquetRowGroup,
  start: number,
  end: number
): arrow.Vector | undefined {
  if (!(arrowType instanceof arrow.List) || parquetField.repetitionType !== 'REPEATED') {
    return undefined;
  }

  const data = parquetField.fields
    ? createRepeatedStructData(arrowType, parquetField, rowGroup, start, end)
    : createRepeatedPrimitiveData(arrowType, parquetField, rowGroup, start, end);
  return data ? new arrow.Vector([data]) : undefined;
}

/** Creates a top-level repeated primitive as Arrow List data. */
function createRepeatedPrimitiveData(
  listType: arrow.List,
  parquetField: ParquetField,
  rowGroup: ParquetRowGroup,
  start: number,
  end: number
): arrow.Data | undefined {
  const columnData = rowGroup.columnData[parquetField.key];
  if (!columnData) {
    return undefined;
  }

  const selected = selectRootRepeatedValues(columnData, parquetField, start, end);
  const childData = createSelectedLeafData(
    listType.children[0].type,
    parquetField,
    columnData,
    selected
  );
  if (!childData) {
    return undefined;
  }

  return arrow.makeData({
    type: listType,
    valueOffsets: selected.valueOffsets,
    child: childData
  } as any);
}

/** Creates a top-level repeated group as Arrow List<Struct> data. */
function createRepeatedStructData(
  listType: arrow.List,
  parquetField: ParquetField,
  rowGroup: ParquetRowGroup,
  start: number,
  end: number
): arrow.Data | undefined {
  const structType = listType.children[0].type;
  if (!(structType instanceof arrow.Struct)) {
    return undefined;
  }

  const primitiveLeaves = listPrimitiveLeaves(parquetField);
  const driverField = primitiveLeaves.reduce<ParquetField | undefined>(
    (driver, leaf) => (!driver || leaf.rLevelMax < driver.rLevelMax ? leaf : driver),
    undefined
  );
  const driverColumn = driverField && rowGroup.columnData[driverField.key];
  if (!driverField || !driverColumn) {
    return undefined;
  }

  const rootLayout = selectRepeatedStructLayout(driverColumn, parquetField, start, end);
  const children: arrow.Data[] = [];
  for (const arrowChild of structType.children) {
    const parquetChild = parquetField.fields?.[arrowChild.name];
    if (!parquetChild || parquetChild.fields) {
      return undefined;
    }
    const columnData = rowGroup.columnData[parquetChild.key];
    if (!columnData) {
      return undefined;
    }

    let childData: arrow.Data | undefined;
    if (parquetChild.repetitionType === 'REPEATED' && arrowChild.type instanceof arrow.List) {
      childData = createRepeatedStructChildData(
        arrowChild.type,
        parquetField,
        parquetChild,
        columnData,
        start,
        end,
        rootLayout.elementCount
      );
    } else {
      const selected = selectStructScalarValues(
        columnData,
        parquetField,
        parquetChild,
        start,
        end,
        rootLayout.elementCount
      );
      childData = createSelectedLeafData(arrowChild.type, parquetChild, columnData, selected);
    }
    if (!childData) {
      return undefined;
    }
    children.push(childData);
  }

  const structData = arrow.makeData({
    type: structType,
    length: rootLayout.elementCount,
    nullCount: 0,
    children
  });
  return arrow.makeData({
    type: listType,
    valueOffsets: rootLayout.valueOffsets,
    child: structData
  } as any);
}

/** Creates one repeated primitive child within a repeated struct. */
function createRepeatedStructChildData(
  listType: arrow.List,
  parentField: ParquetField,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  start: number,
  end: number,
  parentCount: number
): arrow.Data | undefined {
  const selected = selectStructRepeatedValues(
    columnData,
    parentField,
    parquetField,
    start,
    end,
    parentCount
  );
  const childData = createSelectedLeafData(
    listType.children[0].type,
    parquetField,
    columnData,
    selected
  );
  if (!childData) {
    return undefined;
  }
  return arrow.makeData({
    type: listType,
    valueOffsets: selected.valueOffsets,
    child: childData
  } as any);
}

/** Selects primitive values and row offsets for a top-level repeated leaf. */
function selectRootRepeatedValues(
  columnData: ParquetColumnChunk,
  parquetField: ParquetField,
  start: number,
  end: number
): SelectedRepeatedValues {
  const rowCount = end - start;
  const valueCounts = new Int32Array(rowCount);
  let rowIndex = -1;
  let sourceValueIndex = 0;
  let firstValueIndex = -1;
  let valueCount = 0;

  for (let levelIndex = 0; levelIndex < columnData.dlevels.length; levelIndex++) {
    if (columnData.rlevels[levelIndex] === 0) {
      rowIndex++;
    }
    const hasValue = columnData.dlevels[levelIndex] === parquetField.dLevelMax;
    if (rowIndex >= start && rowIndex < end && hasValue) {
      firstValueIndex = firstValueIndex < 0 ? sourceValueIndex : firstValueIndex;
      valueCounts[rowIndex - start]++;
      valueCount++;
    }
    if (hasValue) {
      sourceValueIndex++;
    }
    if (rowIndex >= end) {
      break;
    }
  }

  return {
    length: valueCount,
    firstValueIndex: Math.max(0, firstValueIndex),
    valueCount,
    nullCount: 0,
    valueOffsets: accumulateOffsets(valueCounts)
  };
}

/** Selects row offsets and element count for a top-level repeated group. */
function selectRepeatedStructLayout(
  columnData: ParquetColumnChunk,
  parentField: ParquetField,
  start: number,
  end: number
): {valueOffsets: Int32Array; elementCount: number} {
  const valueCounts = new Int32Array(end - start);
  let rowIndex = -1;
  let elementCount = 0;

  for (let levelIndex = 0; levelIndex < columnData.dlevels.length; levelIndex++) {
    const repetitionLevel = columnData.rlevels[levelIndex];
    if (repetitionLevel === 0) {
      rowIndex++;
    }
    if (
      rowIndex >= start &&
      rowIndex < end &&
      repetitionLevel <= parentField.rLevelMax &&
      columnData.dlevels[levelIndex] >= parentField.dLevelMax
    ) {
      valueCounts[rowIndex - start]++;
      elementCount++;
    }
    if (rowIndex >= end) {
      break;
    }
  }

  return {valueOffsets: accumulateOffsets(valueCounts), elementCount};
}

/** Selects scalar child values aligned to the repeated parent struct elements. */
function selectStructScalarValues(
  columnData: ParquetColumnChunk,
  parentField: ParquetField,
  parquetField: ParquetField,
  start: number,
  end: number,
  parentCount: number
): SelectedLeafValues {
  const nullBitmap = new Uint8Array(Math.ceil(parentCount / 8));
  let rowIndex = -1;
  let sourceValueIndex = 0;
  let firstValueIndex = -1;
  let outputIndex = 0;
  let valueCount = 0;

  for (let levelIndex = 0; levelIndex < columnData.dlevels.length; levelIndex++) {
    const repetitionLevel = columnData.rlevels[levelIndex];
    if (repetitionLevel === 0) {
      rowIndex++;
    }
    const definitionLevel = columnData.dlevels[levelIndex];
    const hasValue = definitionLevel === parquetField.dLevelMax;
    if (
      rowIndex >= start &&
      rowIndex < end &&
      repetitionLevel <= parentField.rLevelMax &&
      definitionLevel >= parentField.dLevelMax
    ) {
      if (hasValue) {
        firstValueIndex = firstValueIndex < 0 ? sourceValueIndex : firstValueIndex;
        nullBitmap[outputIndex >> 3] |= 1 << (outputIndex & 7);
        valueCount++;
      }
      outputIndex++;
    }
    if (hasValue) {
      sourceValueIndex++;
    }
    if (rowIndex >= end) {
      break;
    }
  }

  if (outputIndex !== parentCount) {
    throw new Error(
      `Parquet nested column ${parquetField.key} has ${outputIndex} parent values; expected ${parentCount}`
    );
  }
  const nullCount = parentCount - valueCount;
  return {
    length: parentCount,
    firstValueIndex: Math.max(0, firstValueIndex),
    valueCount,
    nullBitmap: nullCount ? nullBitmap : undefined,
    nullCount
  };
}

/** Selects repeated child values and list offsets aligned to repeated parent struct elements. */
function selectStructRepeatedValues(
  columnData: ParquetColumnChunk,
  parentField: ParquetField,
  parquetField: ParquetField,
  start: number,
  end: number,
  parentCount: number
): SelectedRepeatedValues {
  const valueCounts = new Int32Array(parentCount);
  let rowIndex = -1;
  let parentIndex = -1;
  let sourceValueIndex = 0;
  let firstValueIndex = -1;
  let valueCount = 0;

  for (let levelIndex = 0; levelIndex < columnData.dlevels.length; levelIndex++) {
    const repetitionLevel = columnData.rlevels[levelIndex];
    if (repetitionLevel === 0) {
      rowIndex++;
    }
    const definitionLevel = columnData.dlevels[levelIndex];
    const hasValue = definitionLevel === parquetField.dLevelMax;
    if (rowIndex >= start && rowIndex < end) {
      if (repetitionLevel <= parentField.rLevelMax && definitionLevel >= parentField.dLevelMax) {
        parentIndex++;
      }
      if (hasValue) {
        if (parentIndex < 0 || parentIndex >= parentCount) {
          throw new Error(
            `Parquet nested column ${parquetField.key} has invalid repetition levels`
          );
        }
        firstValueIndex = firstValueIndex < 0 ? sourceValueIndex : firstValueIndex;
        valueCounts[parentIndex]++;
        valueCount++;
      }
    }
    if (hasValue) {
      sourceValueIndex++;
    }
    if (rowIndex >= end) {
      break;
    }
  }

  if (parentIndex + 1 !== parentCount) {
    throw new Error(
      `Parquet nested column ${parquetField.key} has ${parentIndex + 1} parent values; expected ${parentCount}`
    );
  }
  return {
    length: valueCount,
    firstValueIndex: Math.max(0, firstValueIndex),
    valueCount,
    nullCount: 0,
    valueOffsets: accumulateOffsets(valueCounts)
  };
}

/** Creates Arrow primitive or byte data for selected decoded leaf values. */
function createSelectedLeafData(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  selected: SelectedLeafValues
): arrow.Data | undefined {
  const primitiveData = createSelectedPrimitiveData(arrowType, parquetField, columnData, selected);
  if (primitiveData) {
    return primitiveData;
  }
  return createSelectedByteData(arrowType, parquetField, columnData, selected);
}

/** Creates fixed-width Arrow data for selected physical primitive values. */
function createSelectedPrimitiveData(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  selected: SelectedLeafValues
): arrow.Data | undefined {
  const directData = createSelectedPrimitiveArrayView(
    arrowType,
    parquetField,
    columnData,
    selected
  );
  if (directData) {
    return arrow.makeData({type: arrowType, data: directData, nullCount: 0} as any);
  }

  const data = createNestedPrimitiveArray(arrowType, parquetField, selected.length);
  if (!data) {
    return undefined;
  }

  const sourceValues = columnData.values;
  let sourceValueIndex = selected.firstValueIndex;
  for (let outputIndex = 0; outputIndex < selected.length; outputIndex++) {
    if (!selected.nullBitmap || selected.nullBitmap[outputIndex >> 3] & (1 << (outputIndex & 7))) {
      setNestedPrimitiveValue(data, outputIndex, sourceValues[sourceValueIndex++]);
    }
  }

  return arrow.makeData({
    type: arrowType,
    data,
    nullBitmap: selected.nullBitmap,
    nullCount: selected.nullCount
  } as any);
}

/** Reuses a contiguous decoded primitive range when nested selection needs no null expansion. */
function createSelectedPrimitiveArrayView(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  selected: SelectedLeafValues
): NestedPrimitiveArrowArray | undefined {
  if (selected.nullCount || selected.length !== selected.valueCount) {
    return undefined;
  }
  const values = getMatchingNestedPrimitiveArray(arrowType, parquetField, columnData.values);
  return values?.subarray(
    selected.firstValueIndex,
    selected.firstValueIndex + selected.valueCount
  ) as NestedPrimitiveArrowArray | undefined;
}

/** Returns decoded nested values when their physical array exactly matches the Arrow type. */
function getMatchingNestedPrimitiveArray(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  values: ParquetColumnChunk['values']
): NestedPrimitiveArrowArray | undefined {
  if (
    parquetField.primitiveType === 'FLOAT' &&
    arrowType instanceof arrow.Float32 &&
    values instanceof Float32Array
  ) {
    return values;
  }
  if (
    parquetField.primitiveType === 'DOUBLE' &&
    arrowType instanceof arrow.Float64 &&
    values instanceof Float64Array
  ) {
    return values;
  }
  if (parquetField.primitiveType === 'INT32') {
    if (arrowType instanceof arrow.Int8 && values instanceof Int8Array) return values;
    if (arrowType instanceof arrow.Int16 && values instanceof Int16Array) return values;
    if (
      (arrowType instanceof arrow.Int32 ||
        arrowType instanceof arrow.DateDay ||
        arrowType instanceof arrow.TimeMillisecond) &&
      values instanceof Int32Array
    ) {
      return values;
    }
    if (arrowType instanceof arrow.Uint8 && values instanceof Uint8Array) return values;
    if (arrowType instanceof arrow.Uint16 && values instanceof Uint16Array) return values;
    if (arrowType instanceof arrow.Uint32 && values instanceof Uint32Array) return values;
  }
  if (parquetField.primitiveType === 'INT64') {
    if (
      (arrowType instanceof arrow.Int64 ||
        arrowType instanceof arrow.TimeMicrosecond ||
        arrowType instanceof arrow.TimeNanosecond ||
        arrowType instanceof arrow.TimestampMillisecond ||
        arrowType instanceof arrow.TimestampMicrosecond ||
        arrowType instanceof arrow.TimestampNanosecond) &&
      values instanceof BigInt64Array
    ) {
      return values;
    }
    if (arrowType instanceof arrow.Uint64 && values instanceof BigUint64Array) return values;
  }
  return undefined;
}

/** Allocates the Arrow array matching an unconverted physical Parquet primitive. */
function createNestedPrimitiveArray(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  length: number
): NestedPrimitiveArrowArray | undefined {
  if (parquetField.primitiveType === 'FLOAT' && arrowType instanceof arrow.Float32) {
    return new Float32Array(length);
  }
  if (parquetField.primitiveType === 'DOUBLE' && arrowType instanceof arrow.Float64) {
    return new Float64Array(length);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Int8) {
    return new Int8Array(length);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Int16) {
    return new Int16Array(length);
  }
  if (
    parquetField.primitiveType === 'INT32' &&
    (arrowType instanceof arrow.Int32 ||
      arrowType instanceof arrow.DateDay ||
      arrowType instanceof arrow.TimeMillisecond)
  ) {
    return new Int32Array(length);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint8) {
    return new Uint8Array(length);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint16) {
    return new Uint16Array(length);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint32) {
    return new Uint32Array(length);
  }
  if (
    parquetField.primitiveType === 'INT64' &&
    (arrowType instanceof arrow.Int64 ||
      arrowType instanceof arrow.TimeMicrosecond ||
      arrowType instanceof arrow.TimeNanosecond ||
      arrowType instanceof arrow.TimestampMillisecond ||
      arrowType instanceof arrow.TimestampMicrosecond ||
      arrowType instanceof arrow.TimestampNanosecond)
  ) {
    return new BigInt64Array(length);
  }
  if (parquetField.primitiveType === 'INT64' && arrowType instanceof arrow.Uint64) {
    return new BigUint64Array(length);
  }
  return undefined;
}

/** Writes one decoded primitive into the exact array expected by Arrow. */
function setNestedPrimitiveValue(
  data: NestedPrimitiveArrowArray,
  index: number,
  value: unknown
): void {
  if (data instanceof BigInt64Array) {
    data[index] = typeof value === 'bigint' ? value : BigInt(value as number | string);
  } else if (data instanceof BigUint64Array) {
    data[index] = BigInt.asUintN(
      64,
      typeof value === 'bigint' ? value : BigInt(value as number | string)
    );
  } else {
    data[index] = Number(value);
  }
}

/** Creates Arrow Utf8 or Binary data for selected decoded byte values. */
function createSelectedByteData(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  selected: SelectedLeafValues
): arrow.Data | undefined {
  if (!supportsNestedByteData(arrowType, parquetField)) {
    return undefined;
  }
  if (columnData.byteArrayData) {
    return createSelectedBufferedByteData(arrowType, columnData, selected);
  }

  const byteValues = columnData.values as Uint8Array[];
  const valueOffsets = new Int32Array(selected.length + 1);
  let sourceValueIndex = selected.firstValueIndex;
  let dataByteLength = 0;
  for (let outputIndex = 0; outputIndex < selected.length; outputIndex++) {
    if (!selected.nullBitmap || selected.nullBitmap[outputIndex >> 3] & (1 << (outputIndex & 7))) {
      dataByteLength += byteValues[sourceValueIndex++].byteLength;
      if (dataByteLength > 0x7fffffff) {
        throw new Error('Arrow Utf8/Binary column exceeds the 32-bit offset range');
      }
    }
    valueOffsets[outputIndex + 1] = dataByteLength;
  }

  const data = new Uint8Array(dataByteLength);
  let dataOffset = 0;
  const valueEnd = selected.firstValueIndex + selected.valueCount;
  for (let valueIndex = selected.firstValueIndex; valueIndex < valueEnd; valueIndex++) {
    const bytes = byteValues[valueIndex];
    if (bytes.byteLength <= MAXIMUM_INLINE_BYTE_COPY_LENGTH) {
      for (let byteIndex = 0; byteIndex < bytes.byteLength; byteIndex++) {
        data[dataOffset++] = bytes[byteIndex];
      }
    } else {
      data.set(bytes, dataOffset);
      dataOffset += bytes.byteLength;
    }
  }

  return arrow.makeData({
    type: arrowType,
    valueOffsets,
    data,
    nullBitmap: selected.nullBitmap,
    nullCount: selected.nullCount
  } as any);
}

/** Creates selected nested Arrow bytes from the decoder's compact physical value buffer. */
function createSelectedBufferedByteData(
  arrowType: arrow.DataType,
  columnData: ParquetColumnChunk,
  selected: SelectedLeafValues
): arrow.Data {
  const byteArrayData = columnData.byteArrayData!;
  const valueOffsets = new Int32Array(selected.length + 1);
  let sourceValueIndex = selected.firstValueIndex;
  let dataByteLength = 0;
  for (let outputIndex = 0; outputIndex < selected.length; outputIndex++) {
    if (!selected.nullBitmap || selected.nullBitmap[outputIndex >> 3] & (1 << (outputIndex & 7))) {
      dataByteLength +=
        byteArrayData.valueOffsets[sourceValueIndex + 1] -
        byteArrayData.valueOffsets[sourceValueIndex];
      sourceValueIndex++;
    }
    valueOffsets[outputIndex + 1] = dataByteLength;
  }
  const firstByteOffset = byteArrayData.valueOffsets[selected.firstValueIndex];
  const lastByteOffset = byteArrayData.valueOffsets[selected.firstValueIndex + selected.valueCount];
  return arrow.makeData({
    type: arrowType,
    valueOffsets,
    data: byteArrayData.data.subarray(firstByteOffset, lastByteOffset),
    nullBitmap: selected.nullBitmap,
    nullCount: selected.nullCount
  } as any);
}

/** Returns whether one Parquet byte leaf maps directly to Arrow Utf8 or Binary. */
function supportsNestedByteData(arrowType: arrow.DataType, parquetField: ParquetField): boolean {
  if (arrowType instanceof arrow.Utf8) {
    return parquetField.originalType === 'UTF8' || parquetField.originalType === 'ENUM';
  }
  return (
    arrowType instanceof arrow.Binary &&
    (!parquetField.originalType ||
      parquetField.originalType === 'JSON' ||
      parquetField.originalType === 'BSON' ||
      parquetField.originalType === 'INTERVAL' ||
      parquetField.originalType === 'VARIANT' ||
      parquetField.originalType === 'GEOMETRY' ||
      parquetField.originalType === 'GEOGRAPHY') &&
    (parquetField.primitiveType === 'BYTE_ARRAY' ||
      parquetField.primitiveType === 'FIXED_LEN_BYTE_ARRAY')
  );
}

/** Lists all primitive descendant fields in schema order. */
function listPrimitiveLeaves(parquetField: ParquetField): ParquetField[] {
  if (!parquetField.fields) {
    return [parquetField];
  }
  return Object.values(parquetField.fields).flatMap(listPrimitiveLeaves);
}

/** Converts per-parent value counts into Arrow list offsets. */
function accumulateOffsets(valueCounts: Int32Array): Int32Array {
  const valueOffsets = new Int32Array(valueCounts.length + 1);
  for (let index = 0; index < valueCounts.length; index++) {
    valueOffsets[index + 1] = valueOffsets[index] + valueCounts[index];
  }
  return valueOffsets;
}
