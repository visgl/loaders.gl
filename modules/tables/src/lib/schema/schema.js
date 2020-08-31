import assert from '../utils/assert';

// ArrowJS `Schema` API-compatible class for row-based tables (returned from `DataTable`)
// https://loaders.gl/arrowjs/docs/api-reference/schema
export default class Schema {
  constructor(fields, metadata = null) {
    assert(Array.isArray(fields));
    checkNames(fields);
    // For kepler fields, create arrow compatible `Fields` that have kepler fields as `metadata`
    this.fields = fields;
    this.metadata = metadata || new Map();
  }

  // TODO - arrow only seems to compare fields
  compareTo(other) {
    if (this.fields.metadata !== other.fields.metadata) {
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

  select(...columnNames) {
    // Ensure column names reference valid fields
    const nameMap = Object.create(null);
    for (const name of columnNames) {
      nameMap[name] = true;
    }
    const selectedFields = columnNames.filter(field => nameMap[field.name]);
    return new Schema(selectedFields, this.metadata);
  }

  selectAt(...columnIndices) {
    // Ensure column indices reference valid fields
    const selectedFields = columnIndices.map(index => this.fields[index]).filter(Boolean);
    return new Schema(selectedFields, this.metadata);
  }

  assign(schemaOrFields) {
    let metadata = this.metadata;

    let fields = schemaOrFields;
    if (schemaOrFields instanceof Schema) {
      const otherSchema = schemaOrFields;
      fields = otherSchema.fields;
      metadata = mergeMaps(mergeMaps(new Map(), this.metadata), otherSchema.metadata);
    }

    // Create a merged list of fields, overwrite fields in place, new fields at end
    const fieldMap = Object.create(null);

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

function mergeMaps(m1, m2) {
  return new Map([...(m1 || new Map()), ...(m2 || new Map())]);
}
