// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Cross-bundle marker for native ObjectIds. */
const BSON_OBJECT_ID = Symbol.for('loaders.gl.BSONObjectId');

/** A BSON ObjectId, preserving its twelve bytes without MongoDB runtime classes. */
export class BSONObjectId {
  /** Lowercase, 24-character hexadecimal representation. */
  readonly hex: string;

  /** Creates an ObjectId from hexadecimal text or exactly twelve bytes. */
  constructor(value: string | Uint8Array) {
    const hex =
      typeof value === 'string'
        ? value
        : Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('');
    if (!/^[0-9a-f]{24}$/i.test(hex)) {
      throw new Error('BSON: ObjectId must contain exactly 12 bytes or 24 hexadecimal characters');
    }
    this.hex = hex.toLowerCase();
    Object.defineProperty(this, BSON_OBJECT_ID, {value: true});
  }

  /** Returns the hexadecimal identifier. */
  toString(): string {
    return this.hex;
  }
}

/** Lossless representations of BSON values without native JavaScript equivalents.
 * Binary subtypes are preserved as opaque bytes, including compressed/encrypted payloads.
 * Decimal128 bytes are preserved without decimal arithmetic or conversion to number.
 */
export type BSONTaggedValue =
  | {
      /** BSON value discriminator. */
      $bsonType: 'binary';
      /** Binary subtype, 0–255. */
      subtype: number;
      /** Binary payload. */
      data: Uint8Array;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'decimal128';
      /** Sixteen IEEE 754 decimal bytes. */
      bytes: Uint8Array;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'int64' | 'timestamp' | 'date';
      /** Signed int64 or unsigned timestamp bits. */
      value: bigint;
    }
  | {
      /** BSON numeric discriminator. */
      $bsonType: 'double' | 'int32';
      /** Numeric value. */
      value: number;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'regexp';
      /** Unevaluated expression. */
      pattern: string;
      /** Alphabetically ordered BSON flags. */
      options: string;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'code';
      /** Unevaluated JavaScript source. */
      code: string;
      /** Optional scope document. */
      scope?: Record<string, unknown>;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'symbol';
      /** Deprecated BSON symbol text. */
      value: string;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'dbPointer';
      /** Collection namespace. */
      namespace: string;
      /** Referenced identifier. */
      objectId: BSONObjectId;
    }
  | {
      /** BSON value discriminator. */
      $bsonType: 'undefined' | 'minKey' | 'maxKey';
    };

/** Options for the native BSON decoder; MongoDB-specific deserializer options are not supported. */
export type ParseBSONOptions = {
  /** Reject concatenated documents by default, or explicitly decode only the first. */
  concatenatedDocuments?: 'error' | 'first';
  /** Convert safely representable int64 values to numbers. Defaults to true. */
  promoteLongs?: boolean;
  /** Return every int64 as bigint, overriding promoteLongs. Defaults to false. */
  useBigInt64?: boolean;
  /** Preserve int32, double, and int64 wire types as tagged values. Defaults to false. */
  preserveTypes?: boolean;
  /** Maximum nesting depth, including the root document. Defaults to 100. */
  maxDepth?: number;
};

/** Options for the native BSON encoder. */
export type EncodeBSONOptions = {
  /** Omit undefined object properties (default true); undefined array slots become null. */
  ignoreUndefined?: boolean;
  /** Maximum nesting depth, including the root document. Defaults to 100. */
  maxDepth?: number;
};

/** Validates and returns the common nesting budget. */
export function getBSONMaxDepth(maxDepth = 100): number {
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 1) {
    throw new Error('BSON: maxDepth must be a positive safe integer');
  }
  return maxDepth;
}

/** Cross-bundle brand distinguishes BSON scalars from documents containing a $bsonType field. */
const BSON_VALUE = Symbol.for('loaders.gl.BSONValue');

/** Creates an explicitly typed BSON scalar without reserving any document field names.
 * The non-enumerable brand is retained on decoded scalar values. Recreate it after
 * JSON serialization or structured cloning, which do not preserve symbol properties.
 */
export function createBSONValue<Value extends BSONTaggedValue>(value: Value): Value {
  return Object.defineProperty({...value}, BSON_VALUE, {value: true});
}

/** Identifies an explicitly created native BSON scalar. */
export function isBSONValue(value: object): value is BSONTaggedValue {
  return Object.hasOwn(value, BSON_VALUE);
}

/** Recognizes ObjectIds produced by either ESM or CommonJS codec bundles. */
export function isBSONObjectId(value: unknown): value is BSONObjectId {
  return Boolean(value && typeof value === 'object' && Object.hasOwn(value, BSON_OBJECT_ID));
}
