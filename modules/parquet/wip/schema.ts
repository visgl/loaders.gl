// Forked from https://github.com/ironSource/parquetjs under MIT license
import {PARQUET_CODECS} from '../codecs';
import {PARQUET_COMPRESSION_METHODS} from '../compression';
import {PARQUET_LOGICAL_TYPES} from './types';

// const PARQUET_COLUMN_KEY_SEPARATOR = '.';

export type ParquetSchemaOptions = {
  encoding?: 'PLAIN' | 'RLE';
  compression?: 'UNCOMPRESSED' | 'GZIP' | 'SNAPPY' | 'LZO' | 'BROTLI';
};

export type ParquetField = {
  name: string;
  path: string[];
  repetitionType;
  rLevelMax: number;
  dLevelMax: number;
  isNested: boolean;
  fieldCount: number;
  fields: {[key: string]: ParquetField};
  primitiveType?;
  originalType?;
  compression?;
  encoding?;
  typeLength?: number;
};

type JSONSchema = any;

/**
 * A parquet file schema
 */
export class ParquetSchema {
  /** JSON schema */
  schema: JSONSchema;
  /** Map of parsed fields */
  fields: {[fieldName: string]: ParquetField};
  /** List of parsed fields */
  fieldList: ParquetField[];

  /**
   * Create a new schema from a JSON schema definition
   */
  constructor(schema: JSONSchema) {
    this.schema = schema;
    this.fields = buildFields(schema);
    this.fieldList = listFields(this.fields);
  }

  /**
   * Retrieve a field definition
   */
  findField(path: string | string[]): ParquetField {
    const pathCopy = Array.isArray(path)
      ? path.slice(0) // clone array
      : path.split(',');

    let fields = this.fields;
    for (; pathCopy.length > 1; pathCopy.shift()) {
      fields = fields[pathCopy[0]].fields;
    }

    const field = fields[pathCopy[0]];
    if (!field) {
      throw new Error(`parquet: schema field lookup failed for [${path}]`);
    }
    return field;
  }

  /**
   * Retrieve a field definition and all the field's ancestors
   */
  findFieldBranch(path): ParquetField[] {
    if (path.constructor !== Array) {
      path = path.split(',');
    }

    const branch: ParquetField[] = [];
    let n = this.fields;
    for (; path.length > 0; path.shift()) {
      branch.push(n[path[0]]);

      if (path.length > 1) {
        n = n[path[0]].fields;
      }
    }

    return branch;
  }
}

// eslint-disable-next-line complexity, max-statements
function buildFields(
  schema: JSONSchema,
  rLevelParentMax: number = 0,
  dLevelParentMax: number = 0,
  path: string[] = []
): {[key: string]: ParquetField} {
  const fieldList: {[key: string]: ParquetField} = {};
  for (const name in schema) {
    const opts = schema[name];

    /* field repetition type */
    const required = !opts.optional;
    const repeated = Boolean(opts.repeated);
    let rLevelMax = rLevelParentMax;
    let dLevelMax = dLevelParentMax;

    let repetitionType = 'REQUIRED';
    if (!required) {
      repetitionType = 'OPTIONAL';
      ++dLevelMax;
    }

    if (repeated) {
      repetitionType = 'REPEATED';
      ++rLevelMax;

      if (required) {
        ++dLevelMax;
      }
    }

    /* nested field */
    if (opts.fields) {
      fieldList[name] = {
        name,
        path: path.concat([name]),
        repetitionType,
        rLevelMax,
        dLevelMax,
        isNested: true,
        fieldCount: Object.keys(opts.fields).length,
        fields: buildFields(opts.fields, rLevelMax, dLevelMax, path.concat([name]))
      };

      continue; // eslint-disable-line no-continue
    }

    /* field type */
    const typeDef = PARQUET_LOGICAL_TYPES[opts.type];
    if (!typeDef) {
      throw new Error(`parquet: invalid schema type ${opts.type}`);
    }

    /* field encoding */
    if (!opts.encoding) {
      opts.encoding = 'PLAIN';
    }
    if (!opts.compression) {
      opts.compression = 'UNCOMPRESSED';
    }

    if (!(opts.encoding in PARQUET_CODECS)) {
      throw new Error(
        `parquet: unsupported schema encoding: ${opts.encoding} (${Object.keys(PARQUET_CODECS)})`
      );
    }

    if (!(opts.compression in PARQUET_COMPRESSION_METHODS)) {
      const methods = Object.keys(PARQUET_COMPRESSION_METHODS);
      throw new Error(`parquet: unsupported schema compression: ${opts.compression} (${methods})`);
    }

    /* add to schema */
    // @ts-ignore
    fieldList[name] = {
      name,
      primitiveType: typeDef.primitiveType,
      originalType: typeDef.originalType,
      path: path.concat([name]),
      repetitionType,
      encoding: opts.encoding,
      compression: opts.compression,
      typeLength: opts.typeLength || typeDef.typeLength,
      rLevelMax,
      dLevelMax
      // isNested: false,
      // fieldCount: 0,
      // fields: {}
    };
  }

  return fieldList;
}

function listFields(fields: {[key: string]: ParquetField}): ParquetField[] {
  let list: ParquetField[] = [];

  for (const k in fields) {
    list.push(fields[k]);

    if (fields[k].isNested) {
      list = list.concat(listFields(fields[k].fields));
    }
  }

  return list;
}
