// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Field,
  Feature,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {
  type LegacyGeoJSONCRS,
  makeGeoArrowFeatureRows,
  makeGeoArrowFeatureSchema
} from '@loaders.gl/gis';
import {ArrowTableBuilder, convertArrowToSchema} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

type PrimitiveArrowDataType = 'null' | 'bool' | 'float64' | 'utf8' | 'date-millisecond';

type ArrowLikeDataType =
  | PrimitiveArrowDataType
  | {
      type: 'list';
      children: [ArrowLikeField];
    }
  | {
      type: 'struct';
      children: ArrowLikeField[];
    };

type ArrowLikeField = {
  name: string;
  type: ArrowLikeDataType;
  nullable: boolean;
};

/** Schema input accepted by JSON Arrow conversion. */
export type JSONArrowSchema = Schema | arrow.Schema;

/** Controls how JSON Arrow conversion handles values that do not match the active schema. */
export type ArrowConversionOptions = {
  /** Behavior when a row value does not match the schema field type. */
  onTypeMismatch?: 'error' | 'null';
  /** Behavior when a row omits a schema field or array column. */
  onMissingField?: 'error' | 'null';
  /** Behavior when a row contains a field or array column that is not in the schema. */
  onExtraField?: 'error' | 'drop';
  /** Whether recovered conversion issues should be logged once per issue kind and field path. */
  logRecoveries?: boolean;
};

/** Options for JSON row-table to Arrow table conversion. */
export type JSONArrowConversionOptions = {
  /** Optional schema to convert against instead of inferring from the current rows. */
  schema?: JSONArrowSchema;
  /** Optional conversion recovery policy. */
  arrowConversion?: ArrowConversionOptions;
  /** Loader log object used for non-spammy recovery warnings. */
  log?: any;
  /** Internal compatibility mode for rows used to infer the current schema. */
  allowMissingNullableFields?: boolean;
};

/** Options for GeoJSON feature to GeoArrow table conversion. */
export type GeoJSONArrowConversionOptions = JSONArrowConversionOptions & {
  /** Geometry column name to use when converting GeoJSON feature rows to GeoArrow WKB. */
  geoarrowGeometryColumn?: string;
  /** Optional legacy GeoJSON root CRS metadata to preserve on GeoArrow output. */
  crs?: LegacyGeoJSONCRS | null;
};

type NormalizedArrowConversionOptions = Required<ArrowConversionOptions>;

type ConversionWarningKind = 'type-mismatch' | 'missing-field' | 'extra-field';

type ConversionLogger = {
  warn: (kind: ConversionWarningKind, path: string, message: string) => void;
};

const DEFAULT_ARROW_CONVERSION_OPTIONS: NormalizedArrowConversionOptions = {
  onTypeMismatch: 'error',
  onMissingField: 'error',
  onExtraField: 'error',
  logRecoveries: true
};

/** Converts NDJSON row-table batches to Arrow table batches. */
export async function* makeNDJSONArrowBatchIterator(
  batches: AsyncIterable<TableBatch>,
  options?: JSONArrowConversionOptions
): AsyncIterable<ArrowTableBatch> {
  let frozenSchema: Schema | null = options?.schema
    ? normalizeJSONArrowSchema(options.schema)
    : null;

  for await (const batch of batches) {
    const rowBatch = batch as ObjectRowTable | ArrayRowTable;
    const arrowTable = convertRowTableToArrowTable(rowBatch, {
      ...options,
      schema: frozenSchema || undefined
    });

    if (!frozenSchema && arrowTable.data.numRows > 0) {
      frozenSchema = arrowTable.schema!;
    }

    yield {
      ...batch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
}

/** Converts GeoJSON features to a GeoArrow WKB Arrow table using JSON Arrow schema policies. */
export function convertGeoJSONFeaturesToArrowTable(
  features: Feature[],
  options?: GeoJSONArrowConversionOptions
): ArrowTable {
  const geometryColumnName = options?.geoarrowGeometryColumn || 'geometry';
  const inferredSchema = makeGeoArrowFeatureSchema(features, {
    geometryColumnName,
    encoding: 'wkb',
    crs: options?.crs
  });
  const schema = options?.schema
    ? applyGeoArrowMetadataToSuppliedSchema(
        normalizeJSONArrowSchema(options.schema),
        inferredSchema,
        geometryColumnName
      )
    : inferredSchema;
  validateGeoArrowSchema(schema, geometryColumnName);

  return convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      schema,
      data: makeGeoArrowFeatureRows(features, {geometryColumnName, encoding: 'wkb'})
    },
    {
      ...options,
      schema,
      allowMissingNullableFields: options?.schema === undefined
    }
  );
}

/** Converts a row table to an Arrow table with recursive JSON schema inference. */
export function convertRowTableToArrowTable(
  table: ObjectRowTable | ArrayRowTable,
  options?: JSONArrowConversionOptions
): ArrowTable {
  const schema = options?.schema
    ? normalizeJSONArrowSchema(options.schema)
    : deduceJSONArrowSchema(table);
  const conversionOptions = normalizeArrowConversionOptions(options?.arrowConversion);
  const conversionLogger = makeConversionLogger(options?.log, conversionOptions.logRecoveries);
  const allowMissingNullableFields =
    options?.allowMissingNullableFields ?? options?.schema === undefined;

  if (schema.fields.length === 0) {
    validateEmptySchemaRowTable(table, conversionOptions, conversionLogger);
    return makeEmptyFieldArrowTable(schema, table.data.length);
  }

  const arrowTableBuilder = new ArrowTableBuilder(schema);

  switch (table.shape) {
    case 'array-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addArrayRow(
          normalizeArrayRowForArrow(row, schema, conversionOptions, conversionLogger, {
            allowMissingNullableFields
          })
        );
      }
      break;
    case 'object-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addObjectRow(
          normalizeObjectRowForArrow(row, schema, conversionOptions, conversionLogger, {
            allowMissingNullableFields
          })
        );
      }
      break;
    default:
      throw new Error('invalid row table shape');
  }

  return arrowTableBuilder.finishTable();
}

/** Validates that all observed row values are compatible with the supplied Arrow schema. */
export function validateRowTableAgainstArrowSchema(
  table: ObjectRowTable | ArrayRowTable,
  schema: Schema
): void {
  convertRowTableToArrowTable(table, {schema, arrowConversion: DEFAULT_ARROW_CONVERSION_OPTIONS});
}

/** Normalizes an accepted JSON Arrow schema input to a serializable loaders.gl schema. */
export function normalizeJSONArrowSchema(schema: JSONArrowSchema): Schema {
  return schema instanceof arrow.Schema ? convertArrowToSchema(schema) : schema;
}

function applyGeoArrowMetadataToSuppliedSchema(
  schema: Schema,
  inferredSchema: Schema,
  geometryColumnName: string
): Schema {
  const inferredGeometryField = inferredSchema.fields.find(
    field => field.name === geometryColumnName
  );

  return {
    ...schema,
    fields: schema.fields.map(field =>
      field.name === geometryColumnName
        ? {
            ...field,
            metadata: {
              ...(field.metadata || {}),
              ...(inferredGeometryField?.metadata || {})
            }
          }
        : field
    ),
    metadata: {
      ...(schema.metadata || {}),
      ...(inferredSchema.metadata?.geo ? {geo: inferredSchema.metadata.geo} : {})
    }
  };
}

function validateGeoArrowSchema(schema: Schema, geometryColumnName: string): void {
  const geometryField = schema.fields.find(field => field.name === geometryColumnName);

  if (!geometryField) {
    throw new Error(
      `JSONLoader: GeoJSON Arrow schema must include geometry field "${geometryColumnName}"`
    );
  }

  if (geometryField.type !== 'binary') {
    throw new Error(
      `JSONLoader: GeoJSON Arrow geometry field "${geometryColumnName}" must have binary type`
    );
  }
}

function normalizeArrowConversionOptions(
  options?: ArrowConversionOptions
): NormalizedArrowConversionOptions {
  return {
    ...DEFAULT_ARROW_CONVERSION_OPTIONS,
    ...options
  };
}

function makeConversionLogger(log: any, enabled: boolean): ConversionLogger {
  const warnedKeys = new Set<string>();

  return {
    warn: (kind: ConversionWarningKind, path: string, message: string) => {
      if (!enabled) {
        return;
      }

      const warningKey = `${kind}:${path}`;
      if (warnedKeys.has(warningKey)) {
        return;
      }
      warnedKeys.add(warningKey);

      if (typeof log?.once === 'function') {
        log.once(message)();
        return;
      }

      if (typeof log?.warn === 'function') {
        log.warn(message)();
      }
    }
  };
}

function validateEmptySchemaRowTable(
  table: ObjectRowTable | ArrayRowTable,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger
): void {
  for (const row of table.data) {
    if (table.shape === 'array-row-table') {
      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        handleExtraField(
          `column-${columnIndex}`,
          conversionOptions,
          conversionLogger,
          'JSONLoader: incompatible Arrow schema, unexpected column index 0'
        );
      }
      continue;
    }

    for (const columnName of Object.keys(row)) {
      handleExtraField(
        columnName,
        conversionOptions,
        conversionLogger,
        `JSONLoader: incompatible Arrow schema, unexpected field ${columnName}`
      );
    }
  }
}

function makeEmptyFieldArrowTable(schema: Schema, rowCount: number): ArrowTable {
  const arrowSchema = new arrow.Schema([]);
  const arrowData = new arrow.Data(new arrow.Struct([]), 0, rowCount, 0, undefined, []);
  const arrowRecordBatch = new arrow.RecordBatch(arrowSchema, arrowData);
  Object.defineProperty(arrowRecordBatch, 'data', {value: arrowData});

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table([arrowRecordBatch])
  };
}

/** Builds a loaders.gl schema for nested JSON rows. */
function deduceJSONArrowSchema(table: ObjectRowTable | ArrayRowTable): Schema {
  let fields: ArrowLikeField[] = [];

  if (table.shape === 'array-row-table') {
    for (const row of table.data) {
      fields = mergeStructFields(fields, getStructChildren(inferArrayRowField(row).type), 'row');
    }
  } else {
    for (const row of table.data) {
      fields = mergeStructFields(fields, getStructChildren(inferObjectRowField(row).type), 'row');
    }
  }

  return {
    fields: fields.map(field => toSchemaField(field)),
    metadata: table.schema?.metadata || {}
  };
}

/** Infers one synthetic struct field from an array row. */
function inferArrayRowField(row: unknown[]): ArrowLikeField {
  const fields = row.map((value, columnIndex) => inferValueField(`column-${columnIndex}`, value));
  return {
    name: 'row',
    type: {
      type: 'struct',
      children: fields
    },
    nullable: false
  };
}

/** Infers one synthetic struct field from an object row. */
function inferObjectRowField(row: {[columnName: string]: unknown}): ArrowLikeField {
  const fields = Object.entries(row).map(([columnName, value]) =>
    inferValueField(columnName, value)
  );
  return {
    name: 'row',
    type: {
      type: 'struct',
      children: fields
    },
    nullable: false
  };
}

/** Infers a field from one JSON value. */
function inferValueField(name: string, value: unknown): ArrowLikeField {
  if (value === null || value === undefined) {
    return {name, type: 'null', nullable: true};
  }

  if (Array.isArray(value)) {
    let itemField: ArrowLikeField = {name: 'item', type: 'null', nullable: true};
    for (const itemValue of value) {
      itemField = mergeFields(itemField, inferValueField('item', itemValue), `${name}[]`);
    }
    return {
      name,
      type: {
        type: 'list',
        children: [itemField]
      },
      nullable: false
    };
  }

  if (value instanceof Date) {
    return {name, type: 'date-millisecond', nullable: false};
  }

  switch (typeof value) {
    case 'number':
      return {name, type: 'float64', nullable: false};
    case 'boolean':
      return {name, type: 'bool', nullable: false};
    case 'string':
      return {name, type: 'utf8', nullable: false};
    case 'object':
      return {
        name,
        type: {
          type: 'struct',
          children: Object.entries(value as {[key: string]: unknown}).map(([key, childValue]) =>
            inferValueField(key, childValue)
          )
        },
        nullable: false
      };
    default:
      throw new Error(`Unsupported JSON value type at ${name}: ${typeof value}`);
  }
}

/** Merges two struct field lists while tracking nullable missing fields. */
function mergeStructFields(
  leftFields: ArrowLikeField[],
  rightFields: ArrowLikeField[],
  path: string
): ArrowLikeField[] {
  const mergedFields = leftFields.map(field => cloneField(field));
  const mergedFieldIndex = new Map(mergedFields.map((field, index) => [field.name, index]));
  const rightFieldNames = new Set<string>();

  for (const rightField of rightFields) {
    rightFieldNames.add(rightField.name);
    const leftFieldIndex = mergedFieldIndex.get(rightField.name);
    if (leftFieldIndex === undefined) {
      mergedFields.push({...cloneField(rightField), nullable: true});
      mergedFieldIndex.set(rightField.name, mergedFields.length - 1);
      continue;
    }

    mergedFields[leftFieldIndex] = mergeFields(
      mergedFields[leftFieldIndex],
      rightField,
      `${path}.${rightField.name}`
    );
  }

  for (const field of mergedFields) {
    if (!rightFieldNames.has(field.name)) {
      field.nullable = true;
    }
  }

  return mergedFields;
}

/** Merges two field definitions observed at different rows or nesting levels. */
function mergeFields(
  leftField: ArrowLikeField,
  rightField: ArrowLikeField,
  path: string
): ArrowLikeField {
  if (leftField.name !== rightField.name) {
    throw new Error(`JSONLoader: incompatible field merge at ${path}`);
  }

  if (leftField.type === 'null') {
    return {
      name: leftField.name,
      type: cloneDataType(rightField.type),
      nullable: true
    };
  }

  if (rightField.type === 'null') {
    return {
      name: leftField.name,
      type: cloneDataType(leftField.type),
      nullable: true
    };
  }

  return {
    name: leftField.name,
    type: mergeDataTypes(leftField.type, rightField.type, path),
    nullable: leftField.nullable || rightField.nullable
  };
}

/** Merges two non-null Arrow-like data types, rejecting incompatible shapes. */
function mergeDataTypes(
  leftType: ArrowLikeDataType,
  rightType: ArrowLikeDataType,
  path: string
): ArrowLikeDataType {
  if (typeof leftType === 'string' || typeof rightType === 'string') {
    if (leftType === rightType) {
      return cloneDataType(leftType);
    }
    throw new Error(
      `JSONLoader: incompatible Arrow field types at ${path}: ${formatDataType(leftType)} vs ${formatDataType(rightType)}`
    );
  }

  if (leftType.type !== rightType.type) {
    throw new Error(
      `JSONLoader: incompatible Arrow field types at ${path}: ${formatDataType(leftType)} vs ${formatDataType(rightType)}`
    );
  }

  switch (leftType.type) {
    case 'list':
      return {
        type: 'list',
        children: [mergeFields(leftType.children[0], rightType.children[0], `${path}[]`)]
      };

    case 'struct':
      return {
        type: 'struct',
        children: mergeStructFields(leftType.children, rightType.children, path)
      };

    default:
      throw new Error(`JSONLoader: unsupported Arrow field type at ${path}`);
  }
}

/** Returns struct children or an empty list when the type is not a struct. */
function getStructChildren(type: ArrowLikeDataType): ArrowLikeField[] {
  return typeof type === 'object' && type.type === 'struct' ? type.children : [];
}

/** Converts an inferred field to a loaders.gl schema field. */
function toSchemaField(field: ArrowLikeField): Field {
  return {
    name: field.name,
    type: toSchemaDataType(field.type),
    nullable: field.nullable
  };
}

/** Converts one inferred Arrow-like type to a loaders.gl data type. */
function toSchemaDataType(type: ArrowLikeDataType): Field['type'] {
  if (typeof type === 'string') {
    return type;
  }

  switch (type.type) {
    case 'list':
      return {
        type: 'list',
        children: [toSchemaField(type.children[0])]
      };

    case 'struct':
      return {
        type: 'struct',
        children: type.children.map(child => toSchemaField(child))
      };

    default:
      throw new Error('JSONLoader: unsupported inferred Arrow type');
  }
}

/** Normalizes one object row against the active Arrow schema. */
function normalizeObjectRowForArrow(
  row: {[columnName: string]: unknown},
  schema: Schema,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  normalizationOptions: {allowMissingNullableFields: boolean}
): {[columnName: string]: unknown} {
  const schemaFieldNames = new Set(schema.fields.map(field => field.name));
  const normalizedRow: {[columnName: string]: unknown} = {};

  for (const columnName of Object.keys(row)) {
    if (!schemaFieldNames.has(columnName)) {
      handleExtraField(
        columnName,
        conversionOptions,
        conversionLogger,
        `JSONLoader: incompatible Arrow schema, unexpected field ${columnName}`
      );
    }
  }

  for (const field of schema.fields) {
    normalizedRow[field.name] = normalizeValueForArrow(
      field,
      row[field.name],
      field.name,
      Object.prototype.hasOwnProperty.call(row, field.name),
      conversionOptions,
      conversionLogger,
      normalizationOptions
    );
  }
  return normalizedRow;
}

/** Normalizes one array row against the active Arrow schema. */
function normalizeArrayRowForArrow(
  row: unknown[],
  schema: Schema,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  normalizationOptions: {allowMissingNullableFields: boolean}
): unknown[] {
  if (row.length > schema.fields.length) {
    for (let fieldIndex = schema.fields.length; fieldIndex < row.length; fieldIndex++) {
      handleExtraField(
        `column-${fieldIndex}`,
        conversionOptions,
        conversionLogger,
        `JSONLoader: incompatible Arrow schema, unexpected column index ${fieldIndex}`
      );
    }
  }

  return schema.fields.map((field, fieldIndex) =>
    normalizeValueForArrow(
      field,
      row[fieldIndex],
      field.name,
      fieldIndex < row.length,
      conversionOptions,
      conversionLogger,
      normalizationOptions
    )
  );
}

/** Normalizes nested values so Arrow builders receive explicit `null`s. */
function normalizeValueForArrow(
  field: Field,
  value: unknown,
  path: string,
  hasValue: boolean,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  normalizationOptions: {allowMissingNullableFields: boolean}
): unknown {
  if (!hasValue) {
    return recoverMissingField(
      field,
      path,
      conversionOptions,
      conversionLogger,
      normalizationOptions
    );
  }

  if (value === null || value === undefined) {
    if (field.nullable || field.type === 'null') {
      return null;
    }
    return recoverTypeMismatch(
      field,
      path,
      conversionOptions,
      conversionLogger,
      `JSONLoader: incompatible Arrow field at ${path}, expected ${formatFieldType(field)}`
    );
  }

  if (typeof field.type === 'string') {
    if (isPrimitiveValueCompatible(value, field.type)) {
      return value;
    }
    return recoverTypeMismatch(
      field,
      path,
      conversionOptions,
      conversionLogger,
      `JSONLoader: incompatible Arrow field at ${path}, expected ${formatPrimitiveExpectation(field.type)}`
    );
  }

  switch (field.type.type) {
    case 'list':
      const listFieldType = field.type as Extract<Field['type'], {type: 'list'}>;
      if (!Array.isArray(value)) {
        return recoverTypeMismatch(
          field,
          path,
          conversionOptions,
          conversionLogger,
          `JSONLoader: incompatible Arrow field at ${path}, expected list`
        );
      }

      return value.map((itemValue, itemIndex) =>
        normalizeValueForArrow(
          listFieldType.children[0],
          itemValue,
          `${path}[${itemIndex}]`,
          true,
          conversionOptions,
          conversionLogger,
          normalizationOptions
        )
      );

    case 'struct':
      const structFieldType = field.type as Extract<Field['type'], {type: 'struct'}>;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return recoverTypeMismatch(
          field,
          path,
          conversionOptions,
          conversionLogger,
          `JSONLoader: incompatible Arrow field at ${path}, expected struct`
        );
      }

      const structFieldNames = new Set(structFieldType.children.map(childField => childField.name));
      for (const key of Object.keys(value as {[key: string]: unknown})) {
        if (!structFieldNames.has(key)) {
          handleExtraField(
            `${path}.${key}`,
            conversionOptions,
            conversionLogger,
            `JSONLoader: incompatible Arrow schema, unexpected field ${path}.${key}`
          );
        }
      }

      const normalizedStruct: {[key: string]: unknown} = {};
      for (const childField of structFieldType.children) {
        const childRow = value as {[key: string]: unknown};
        normalizedStruct[childField.name] = normalizeValueForArrow(
          childField,
          childRow[childField.name],
          `${path}.${childField.name}`,
          Object.prototype.hasOwnProperty.call(childRow, childField.name),
          conversionOptions,
          conversionLogger,
          normalizationOptions
        );
      }
      return normalizedStruct;

    default:
      throw new Error(`JSONLoader: unsupported Arrow composite field ${path}`);
  }
}

function recoverMissingField(
  field: Field,
  path: string,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  normalizationOptions: {allowMissingNullableFields: boolean}
): null {
  if (
    (normalizationOptions.allowMissingNullableFields ||
      conversionOptions.onMissingField === 'null') &&
    field.nullable
  ) {
    if (!normalizationOptions.allowMissingNullableFields) {
      conversionLogger.warn(
        'missing-field',
        path,
        `JSONLoader: missing Arrow field ${path}; writing null`
      );
    }
    return null;
  }

  throw new Error(`JSONLoader: incompatible Arrow schema, missing field ${path}`);
}

function recoverTypeMismatch(
  field: Field,
  path: string,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  errorMessage: string
): null {
  if (conversionOptions.onTypeMismatch === 'null' && field.nullable) {
    conversionLogger.warn(
      'type-mismatch',
      path,
      `JSONLoader: incompatible Arrow field at ${path}; writing null`
    );
    return null;
  }

  throw new Error(errorMessage);
}

function handleExtraField(
  path: string,
  conversionOptions: NormalizedArrowConversionOptions,
  conversionLogger: ConversionLogger,
  errorMessage: string
): void {
  if (conversionOptions.onExtraField === 'drop') {
    conversionLogger.warn(
      'extra-field',
      path,
      `JSONLoader: extra Arrow field ${path}; dropping value`
    );
    return;
  }

  throw new Error(errorMessage);
}

/** Returns whether a JSON value can be added to one primitive Arrow field type. */
function isPrimitiveValueCompatible(value: unknown, type: string): boolean {
  switch (type) {
    case 'null':
      return value === null;

    case 'bool':
      return typeof value === 'boolean';

    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'float':
    case 'float16':
    case 'float32':
    case 'float64':
      return typeof value === 'number';

    case 'utf8':
      return typeof value === 'string';

    case 'date-millisecond':
    case 'date-day':
    case 'time-second':
    case 'time-millisecond':
    case 'time-microsecond':
    case 'time-nanosecond':
    case 'timestamp-second':
    case 'timestamp-millisecond':
    case 'timestamp-microsecond':
    case 'timestamp-nanosecond':
      return value instanceof Date;

    case 'binary':
      return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
  }

  throw new Error(`JSONLoader: unsupported Arrow primitive field type ${type}`);
}

function formatPrimitiveExpectation(type: string): string {
  switch (type) {
    case 'bool':
      return 'boolean';
    case 'utf8':
      return 'string';
    case 'date-day':
    case 'date-millisecond':
    case 'time-second':
    case 'time-millisecond':
    case 'time-microsecond':
    case 'time-nanosecond':
    case 'timestamp-second':
    case 'timestamp-millisecond':
    case 'timestamp-microsecond':
    case 'timestamp-nanosecond':
      return 'Date';
    case 'binary':
      return 'binary';
    case 'null':
      return 'null';
    default:
      return 'number';
  }
}

function formatFieldType(field: Field): string {
  return typeof field.type === 'string' ? formatPrimitiveExpectation(field.type) : field.type.type;
}

/** Clones one inferred field so merge steps do not mutate shared state. */
function cloneField(field: ArrowLikeField): ArrowLikeField {
  return {
    name: field.name,
    type: cloneDataType(field.type),
    nullable: field.nullable
  };
}

/** Clones one inferred Arrow-like data type. */
function cloneDataType(type: ArrowLikeDataType): ArrowLikeDataType {
  if (typeof type === 'string') {
    return type;
  }

  switch (type.type) {
    case 'list':
      return {
        type: 'list',
        children: [cloneField(type.children[0])]
      };

    case 'struct':
      return {
        type: 'struct',
        children: type.children.map(child => cloneField(child))
      };

    default:
      throw new Error('JSONLoader: unsupported Arrow-like type');
  }
}

/** Formats an inferred Arrow-like type for error messages. */
function formatDataType(type: ArrowLikeDataType): string {
  return typeof type === 'string' ? type : type.type;
}
