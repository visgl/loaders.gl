// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowDenseUnion,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowNumericArray,
  GeoArrowOffsets,
  GeoArrowValidity
} from '@math.gl/geoarrow';
import * as arrow from 'apache-arrow';

/** Options for adapting an Apache Arrow vector to math.gl's runtime-neutral GeoArrow ABI. */
export type MakeGeoArrowColumnFromArrowVectorOptions = {
  /** GeoArrow extension encoding. Inferred from the physical type when omitted. */
  encoding?: GeoArrowEncoding;
  /** Semantic coordinate dimension. Inferred from native coordinate fields when omitted. */
  dimension?: GeoArrowDimension;
  /** Coordinate organization. Inferred from the physical type when omitted. */
  coordinateLayout?: GeoArrowCoordinateLayout | null;
  /** Opaque extension metadata retained on the descriptor envelope. */
  metadata?: Readonly<Record<string, unknown>>;
};

/** Adapts Apache Arrow physical buffers to `@math.gl/geoarrow` borrowed descriptors. */
export function makeGeoArrowColumnFromArrowVector(
  vector: arrow.Vector,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): GeoArrowColumn {
  const encoding = options.encoding ?? inferGeoArrowEncodingFromArrowType(vector.type);
  const dimension =
    options.dimension ??
    (isSerializedArrowType(vector.type) ? 'xy' : inferGeoArrowDimensionFromArrowType(vector.type));
  const coordinateLayout =
    options.coordinateLayout === undefined
      ? inferGeoArrowCoordinateLayoutFromArrowType(vector.type)
      : options.coordinateLayout;

  return {
    encoding,
    dimension,
    coordinateLayout,
    chunks: vector.data.map(data => makeGeoArrowArrayFromArrowData(data)),
    metadata: options.metadata
  };
}

/** Converts a math.gl GeoArrow descriptor back to an Apache Arrow vector. */
export function makeArrowVectorFromGeoArrowColumn(column: GeoArrowColumn): arrow.Vector {
  return new arrow.Vector(
    column.chunks.map(chunk =>
      makeArrowDataFromGeoArrowArray(chunk, column.dimension, column.coordinateLayout)
    )
  );
}

/** Infers a GeoArrow encoding from an Apache Arrow physical type. */
export function inferGeoArrowEncodingFromArrowType(type: arrow.DataType): GeoArrowEncoding {
  if (arrow.DataType.isDenseUnion(type)) return 'geoarrow.geometry';
  if (
    arrow.DataType.isBinary(type) ||
    arrow.DataType.isLargeBinary(type) ||
    arrow.DataType.isBinaryView(type)
  ) {
    return 'geoarrow.wkb';
  }
  if (
    arrow.DataType.isUtf8(type) ||
    arrow.DataType.isLargeUtf8(type) ||
    arrow.DataType.isUtf8View(type)
  ) {
    return 'geoarrow.wkt';
  }

  const nesting = getArrowListNesting(type);
  switch (nesting) {
    case 0:
      return 'geoarrow.point';
    case 1:
      return 'geoarrow.linestring';
    case 2:
      return 'geoarrow.polygon';
    case 3:
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`Cannot infer GeoArrow encoding from Arrow type ${type.toString()}`);
  }
}

/** Infers semantic coordinate dimensions from Arrow coordinate fields. */
export function inferGeoArrowDimensionFromArrowType(type: arrow.DataType): GeoArrowDimension {
  if (arrow.DataType.isFixedSizeList(type)) {
    const dimensionName = type.children[0]?.name.toLowerCase();
    if (isGeoArrowDimension(dimensionName)) return dimensionName;
    switch (type.listSize) {
      case 2:
        return 'xy';
      case 3:
        return 'xyz';
      case 4:
        return 'xyzm';
      default:
        throw new Error(
          `GeoArrow coordinates require 2, 3, or 4 values, received ${type.listSize}`
        );
    }
  }
  if (arrow.DataType.isStruct(type)) {
    const names = type.children.map(field => field.name.toLowerCase());
    if (names[0] === 'x' && names[1] === 'y') {
      if (names[2] === 'm') return 'xym';
      if (names[2] === 'z' && names[3] === 'm') return 'xyzm';
      if (names[2] === 'z') return 'xyz';
      return 'xy';
    }
  }
  if (arrow.DataType.isList(type) || arrow.DataType.isLargeList(type)) {
    return inferGeoArrowDimensionFromArrowType(type.children[0].type);
  }
  if (arrow.DataType.isDenseUnion(type)) {
    return type.children.reduce<GeoArrowDimension>(
      (dimension, field) =>
        mergeGeoArrowDimensions(dimension, inferGeoArrowDimensionFromUnionChild(field)),
      'xy'
    );
  }
  throw new Error(`Cannot infer GeoArrow dimension from Arrow type ${type.toString()}`);
}

/** Infers whether Arrow coordinate leaves are interleaved or separated. */
export function inferGeoArrowCoordinateLayoutFromArrowType(
  type: arrow.DataType
): GeoArrowCoordinateLayout | null {
  if (arrow.DataType.isFixedSizeList(type)) return 'interleaved';
  if (arrow.DataType.isStruct(type)) return 'separated';
  if (arrow.DataType.isList(type) || arrow.DataType.isLargeList(type)) {
    return inferGeoArrowCoordinateLayoutFromArrowType(type.children[0].type);
  }
  if (arrow.DataType.isDenseUnion(type)) {
    for (const field of type.children) {
      const layout = inferGeoArrowCoordinateLayoutFromArrowType(field.type);
      if (layout) return layout;
    }
  }
  return null;
}

function makeGeoArrowArrayFromArrowData(data: arrow.Data): GeoArrowArray {
  const validity = makeGeoArrowValidity(data);
  if (arrow.DataType.isFixedSizeList(data.type)) {
    return {
      kind: 'fixed-size-list',
      length: data.length,
      size: data.type.listSize,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (arrow.DataType.isList(data.type) || arrow.DataType.isLargeList(data.type)) {
    return {
      kind: 'list',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (arrow.DataType.isStruct(data.type)) {
    const children: Record<string, GeoArrowArray> = {};
    for (let childIndex = 0; childIndex < data.type.children.length; childIndex++) {
      children[data.type.children[childIndex].name] = makeGeoArrowArrayFromArrowData(
        data.children[childIndex]
      );
    }
    return {kind: 'struct', length: data.length, children, validity};
  }
  if (arrow.DataType.isDenseUnion(data.type)) {
    const unionType = data.type as arrow.DenseUnion;
    return {
      kind: 'dense-union',
      length: data.length,
      typeIds: data.typeIds as Int8Array | Uint8Array,
      valueOffsets: data.valueOffsets,
      children: unionType.children.map((field, childIndex) => ({
        name: field.name,
        typeId: unionType.typeIds[childIndex],
        encoding: inferGeoArrowEncodingFromUnionChild(field),
        dimension: inferGeoArrowDimensionFromUnionChild(field),
        coordinateLayout: inferGeoArrowCoordinateLayoutFromArrowType(field.type),
        data: makeGeoArrowArrayFromArrowData(data.children[childIndex])
      }))
    };
  }
  if (arrow.DataType.isBinaryView(data.type) || arrow.DataType.isUtf8View(data.type)) {
    const viewBytes = data.values as Uint8Array;
    return {
      kind: 'serialized',
      encoding: arrow.DataType.isBinaryView(data.type) ? 'binary' : 'utf8',
      length: data.length,
      offsets: new Int32Array(0),
      values: new Uint8Array(0),
      views: new Uint32Array(
        viewBytes.buffer,
        viewBytes.byteOffset,
        Math.floor(viewBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT)
      ),
      dataBuffers: data.variadicBuffers,
      validity
    };
  }
  if (isOffsetSerializedArrowType(data.type)) {
    return {
      kind: 'serialized',
      encoding:
        arrow.DataType.isBinary(data.type) || arrow.DataType.isLargeBinary(data.type)
          ? 'binary'
          : 'utf8',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      values: data.values as Uint8Array,
      validity
    };
  }
  if (arrow.DataType.isInt(data.type) || arrow.DataType.isFloat(data.type)) {
    return {
      kind: 'primitive',
      length: data.length,
      values: data.values as GeoArrowNumericArray,
      validity
    };
  }
  throw new Error(`Unsupported GeoArrow physical Arrow type ${data.type.toString()}`);
}

function makeGeoArrowValidity(data: arrow.Data): GeoArrowValidity | undefined {
  if (data.nullCount === 0 || !data.nullBitmap || data.nullBitmap.length === 0) return undefined;
  return {values: data.nullBitmap, bitOffset: data.offset};
}

function makeArrowDataFromGeoArrowArray(
  array: GeoArrowArray,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): arrow.Data {
  const validity = makeCompactValidity(array.validity, array.length);
  const nullCount = validity ? -1 : 0;
  const validityBuffers = validity ? {[arrow.BufferType.VALIDITY]: validity} : {};

  switch (array.kind) {
    case 'primitive': {
      const values = makePackedPrimitiveValues(array);
      return new arrow.Data(getArrowTypeForValues(values), 0, array.length, nullCount, {
        ...validityBuffers,
        [arrow.BufferType.DATA]: values
      });
    }
    case 'fixed-size-list': {
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const childStart = (array.offset ?? 0) * array.size;
      const slicedChild =
        childStart === 0 && child.length === array.length * array.size
          ? child
          : child.slice(childStart, array.length * array.size);
      const type = new arrow.FixedSizeList(
        array.size,
        new arrow.Field('value', slicedChild.type, true)
      );
      return new arrow.Data(type, 0, array.length, nullCount, validityBuffers, [slicedChild]);
    }
    case 'list': {
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const field = new arrow.Field('value', child.type, true);
      const type =
        offsets instanceof BigInt64Array ? new arrow.LargeList(field) : new arrow.List(field);
      return new arrow.Data(
        type,
        0,
        array.length,
        nullCount,
        {...validityBuffers, [arrow.BufferType.OFFSET]: offsets},
        [child]
      );
    }
    case 'struct': {
      const fields: arrow.Field[] = [];
      const children: arrow.Data[] = [];
      for (const [name, childArray] of Object.entries(array.children)) {
        let child = makeArrowDataFromGeoArrowArray(childArray, dimension, coordinateLayout);
        const childOffset = array.offset ?? 0;
        if (childOffset > 0 || child.length !== array.length) {
          child = child.slice(childOffset, array.length);
        }
        fields.push(new arrow.Field(name, child.type, true));
        children.push(child);
      }
      return new arrow.Data(
        new arrow.Struct(fields),
        0,
        array.length,
        nullCount,
        validityBuffers,
        children
      );
    }
    case 'dense-union':
      return makeArrowDenseUnionData(array, dimension, coordinateLayout);
    case 'serialized': {
      if (array.views) {
        const type = array.encoding === 'binary' ? new arrow.BinaryView() : new arrow.Utf8View();
        const viewBytes = new Uint8Array(
          array.views.buffer,
          array.views.byteOffset,
          array.views.byteLength
        );
        return new arrow.Data(
          type,
          0,
          array.length,
          nullCount,
          {...validityBuffers, [arrow.BufferType.DATA]: viewBytes},
          [],
          undefined,
          array.dataBuffers
        );
      }
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const type = getSerializedArrowType(array.encoding, offsets);
      return new arrow.Data(type, 0, array.length, nullCount, {
        ...validityBuffers,
        [arrow.BufferType.OFFSET]: offsets,
        [arrow.BufferType.DATA]: array.values
      });
    }
  }
}

function makeArrowDenseUnionData(
  array: GeoArrowDenseUnion,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): arrow.Data {
  const offset = array.offset ?? 0;
  const sourceTypeIds = array.typeIds.subarray(offset, offset + array.length);
  const typeIds =
    sourceTypeIds instanceof Int8Array
      ? sourceTypeIds
      : new Int8Array(sourceTypeIds.buffer, sourceTypeIds.byteOffset, sourceTypeIds.byteLength);
  const valueOffsets = array.valueOffsets.subarray(offset, offset + array.length);
  const children = array.children.map(child =>
    makeArrowDataFromGeoArrowArray(
      child.data,
      child.dimension ?? dimension,
      child.coordinateLayout === undefined ? coordinateLayout : child.coordinateLayout
    )
  );

  if (array.validity) {
    for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
      if (isGeoArrowValueValid(array.validity, rowIndex)) continue;
      const childIndex = array.children.findIndex(child => child.typeId === typeIds[rowIndex]);
      const childOffset = valueOffsets[rowIndex];
      const childValidity = array.children[childIndex]?.data.validity;
      if (
        childIndex < 0 ||
        childOffset < 0 ||
        childOffset >= children[childIndex].length ||
        !childValidity ||
        isGeoArrowValueValid(childValidity, childOffset)
      ) {
        throw new Error('GeoArrow dense-union null does not reference a nullable child value');
      }
    }
  }

  const fields = array.children.map(
    (child, childIndex) =>
      new arrow.Field(
        getArrowUnionChildName(child.name, child.dimension ?? dimension),
        children[childIndex].type,
        true
      )
  );
  const type = new arrow.DenseUnion(
    Int32Array.from(array.children.map(child => child.typeId)),
    fields
  );
  return new arrow.Data(
    type,
    0,
    array.length,
    0,
    {[arrow.BufferType.TYPE]: typeIds, [arrow.BufferType.OFFSET]: valueOffsets},
    children
  );
}

function makePackedPrimitiveValues(
  array: Extract<GeoArrowArray, {kind: 'primitive'}>
): GeoArrowNumericArray {
  const offset = array.offset ?? 0;
  const stride = array.stride ?? 1;
  if (stride === 1) {
    return array.values.subarray(offset, offset + array.length) as GeoArrowNumericArray;
  }
  const ValuesConstructor = array.values.constructor as {
    new (length: number): GeoArrowNumericArray;
  };
  const values = new ValuesConstructor(array.length);
  for (let index = 0; index < array.length; index++) {
    values[index] = array.values[offset + index * stride] as never;
  }
  return values;
}

function getArrowTypeForValues(values: GeoArrowNumericArray): arrow.DataType {
  if (values instanceof Int8Array) return new arrow.Int8();
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) return new arrow.Uint8();
  if (values instanceof Int16Array) return new arrow.Int16();
  if (values instanceof Uint16Array) return new arrow.Uint16();
  if (values instanceof Int32Array) return new arrow.Int32();
  if (values instanceof Uint32Array) return new arrow.Uint32();
  if (values instanceof BigInt64Array) return new arrow.Int64();
  if (values instanceof BigUint64Array) return new arrow.Uint64();
  if (values instanceof Float32Array) return new arrow.Float32();
  if (values instanceof Float64Array) return new arrow.Float64();
  throw new Error(`Unsupported GeoArrow primitive values ${(values as object).constructor.name}`);
}

function makeArrowOffsets(
  offsets: GeoArrowOffsets,
  offset = 0,
  length: number,
  offsetBase: number | bigint = 0
): GeoArrowOffsets {
  const source = offsets.subarray(offset, offset + length + 1) as GeoArrowOffsets;
  if (offsetBase === 0 || offsetBase === 0n) return source;
  const normalized =
    offsets instanceof BigInt64Array
      ? new BigInt64Array(source.length)
      : new Int32Array(source.length);
  for (let index = 0; index < source.length; index++) {
    if (normalized instanceof BigInt64Array) {
      normalized[index] = BigInt(source[index]) - BigInt(offsetBase);
    } else {
      normalized[index] = Number(source[index]) - Number(offsetBase);
    }
  }
  return normalized;
}

function makeCompactValidity(
  validity: GeoArrowValidity | undefined,
  length: number
): Uint8Array | undefined {
  if (!validity) return undefined;
  const bitOffset = validity.bitOffset ?? 0;
  if (bitOffset === 0 && validity.values.length === Math.ceil(length / 8)) {
    return validity.values;
  }
  const values = new Uint8Array(Math.ceil(length / 8));
  let nullCount = 0;
  for (let index = 0; index < length; index++) {
    if (isGeoArrowValueValid(validity, index)) values[index >> 3] |= 1 << (index & 7);
    else nullCount++;
  }
  return nullCount > 0 ? values : undefined;
}

function isGeoArrowValueValid(validity: GeoArrowValidity, index: number): boolean {
  const bitIndex = (validity.bitOffset ?? 0) + index;
  return Boolean(validity.values[bitIndex >> 3] & (1 << (bitIndex & 7)));
}

function inferGeoArrowEncodingFromUnionChild(field: arrow.Field): GeoArrowEncoding {
  const normalizedName = field.name.replace(/[^a-z]/gi, '').toLowerCase();
  const names: Record<string, GeoArrowEncoding> = {
    point: 'geoarrow.point',
    linestring: 'geoarrow.linestring',
    polygon: 'geoarrow.polygon',
    multipoint: 'geoarrow.multipoint',
    multilinestring: 'geoarrow.multilinestring',
    multipolygon: 'geoarrow.multipolygon',
    geometrycollection: 'geoarrow.geometrycollection'
  };
  for (const [name, encoding] of Object.entries(names)) {
    if (normalizedName.startsWith(name)) return encoding;
  }
  return inferGeoArrowEncodingFromArrowType(field.type);
}

function inferGeoArrowDimensionFromUnionChild(field: arrow.Field): GeoArrowDimension {
  if (/\sZM$/i.test(field.name)) return 'xyzm';
  if (/\sM$/i.test(field.name)) return 'xym';
  if (/\sZ$/i.test(field.name)) return 'xyz';
  return inferGeoArrowDimensionFromArrowType(field.type);
}

function getArrowUnionChildName(name: string, dimension: GeoArrowDimension): string {
  if (/\s(?:Z|M|ZM)$/i.test(name) || dimension === 'xy') return name;
  const suffix = dimension === 'xyz' ? 'Z' : dimension === 'xym' ? 'M' : 'ZM';
  return `${name} ${suffix}`;
}

function getArrowListNesting(type: arrow.DataType): number {
  let nesting = 0;
  let currentType = type;
  while (arrow.DataType.isList(currentType) || arrow.DataType.isLargeList(currentType)) {
    nesting++;
    currentType = currentType.children[0].type;
  }
  if (arrow.DataType.isFixedSizeList(currentType) || arrow.DataType.isStruct(currentType)) {
    return nesting;
  }
  throw new Error(`GeoArrow type does not terminate in coordinates: ${type.toString()}`);
}

function getSerializedArrowType(
  encoding: 'binary' | 'utf8',
  offsets: GeoArrowOffsets
): arrow.DataType {
  if (encoding === 'binary') {
    return offsets instanceof BigInt64Array ? new arrow.LargeBinary() : new arrow.Binary();
  }
  return offsets instanceof BigInt64Array ? new arrow.LargeUtf8() : new arrow.Utf8();
}

function isOffsetSerializedArrowType(type: arrow.DataType): boolean {
  return (
    arrow.DataType.isBinary(type) ||
    arrow.DataType.isLargeBinary(type) ||
    arrow.DataType.isUtf8(type) ||
    arrow.DataType.isLargeUtf8(type)
  );
}

function isSerializedArrowType(type: arrow.DataType): boolean {
  return (
    isOffsetSerializedArrowType(type) ||
    arrow.DataType.isBinaryView(type) ||
    arrow.DataType.isUtf8View(type)
  );
}

function isGeoArrowDimension(value: string | undefined): value is GeoArrowDimension {
  return value === 'xy' || value === 'xyz' || value === 'xym' || value === 'xyzm';
}

function mergeGeoArrowDimensions(
  left: GeoArrowDimension,
  right: GeoArrowDimension
): GeoArrowDimension {
  if (left === right) return left;
  if (left === 'xy') return right;
  if (right === 'xy') return left;
  if (left === 'xyzm' || right === 'xyzm') return 'xyzm';
  return left === 'xym' && right === 'xym' ? 'xym' : 'xyzm';
}
