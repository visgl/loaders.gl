import {assert} from '../../utils/assert';
import Field from './field';

export type SchemaMetadata = Map<string, any>;

/**
 * ArrowJS `Schema` API-compatible class for row-based tables (returned from `DataTable`)
 * https://loaders.gl/arrowjs/docs/api-reference/schema
 */
export default class Schema {
  fields: Field[];
  // TODO - Arrow just allows Map<string, string>
  metadata: SchemaMetadata;

  constructor(fields: Field[], metadata?: SchemaMetadata) {
    assert(Array.isArray(fields));
    checkNames(fields);
    // For kepler fields, create arrow compatible `Fields` that have kepler fields as `metadata`
    this.fields = fields;
    this.metadata = metadata || new Map();
  }

  // TODO - arrow only seems to compare fields, not metadata
  compareTo(other: Schema): boolean {
    if (this.metadata !== other.metadata) {
      return false;
    }
    if (this.fields.length !== other.fields.length) {
      return false;
    }
    for (let i = 0; i < this.fields.length; ++i) {
      if (!this.fields[i].compareTo(other.fields[i])) {
        return false;
      }
    }
    return true;
  }

  select(...columnNames: string[]): Schema {
    // Ensure column names reference valid fields
    const nameMap = Object.create(null);
    for (const name of columnNames) {
      nameMap[name] = true;
    }
    const selectedFields = this.fields.filter((field) => nameMap[field.name]);
    return new Schema(selectedFields, this.metadata);
  }

  selectAt(...columnIndices: number[]): Schema {
    // Ensure column indices reference valid fields
    const selectedFields = columnIndices.map((index) => this.fields[index]).filter(Boolean);
    return new Schema(selectedFields, this.metadata);
  }

  assign(schemaOrFields: Schema | Field[]): Schema {
    let fields: Field[];
    let metadata: SchemaMetadata = this.metadata;

    if (schemaOrFields instanceof Schema) {
      const otherSchema = schemaOrFields;
      fields = otherSchema.fields;
      metadata = mergeMaps(mergeMaps(new Map(), this.metadata), otherSchema.metadata);
    } else {
      fields = schemaOrFields;
    }

    // Create a merged list of fields, overwrite fields in place, new fields at end
    const fieldMap: {[key: string]: Field} = Object.create(null);

    for (const field of this.fields) {
      fieldMap[field.name] = field;
    }

    for (const field of fields) {
      fieldMap[field.name] = field;
    }

    const mergedFields = Object.values(fieldMap);

    return new Schema(mergedFields, metadata);
  }
}

// Warn if any duplicated field names
function checkNames(fields) {
  const usedNames = {};
  for (const field of fields) {
    if (usedNames[field.name]) {
      // eslint-disable-next-line
      console.warn('Schema: duplicated field name', field.name, field);
    }
    usedNames[field.name] = true;
  }
}

function mergeMaps<T>(m1: T, m2: T): T {
  // @ts-ignore
  return new Map([...(m1 || new Map()), ...(m2 || new Map())]);
}
