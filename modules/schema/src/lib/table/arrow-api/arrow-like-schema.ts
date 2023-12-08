// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SchemaMetadata, Field} from '../../../types/schema';
import {ArrowLikeField} from './arrow-like-field';

export class ArrowLikeSchema {
  fields: ArrowLikeField[];
  metadata: Map<string, string>;

  constructor(
    fields: ArrowLikeField[] | Field[],
    metadata: SchemaMetadata | Map<string, string> = new Map<string, string>()
  ) {
    // checkNames(fields);
    // For kepler fields, create arrow compatible `Fields` that have kepler fields as `metadata`
    this.fields = fields.map(
      (field) => new ArrowLikeField(field.name, field.type, field.nullable, field.metadata)
    );
    this.metadata =
      metadata instanceof Map ? metadata : new Map<string, string>(Object.entries(metadata));
  }

  // TODO - arrow only seems to compare fields, not metadata
  compareTo(other: ArrowLikeSchema): boolean {
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

  select(...columnNames: string[]): ArrowLikeSchema {
    // Ensure column names reference valid fields
    const nameMap = Object.create(null);
    for (const name of columnNames) {
      nameMap[name] = true;
    }
    const selectedFields = this.fields.filter((field) => nameMap[field.name]);
    return new ArrowLikeSchema(selectedFields, this.metadata);
  }

  selectAt(...columnIndices: number[]): ArrowLikeSchema {
    // Ensure column indices reference valid fields
    const selectedFields = columnIndices.map((index) => this.fields[index]).filter(Boolean);
    return new ArrowLikeSchema(selectedFields, this.metadata);
  }

  assign(schemaOrFields: ArrowLikeSchema | ArrowLikeField[]): ArrowLikeSchema {
    let fields: ArrowLikeField[];
    let metadata = this.metadata;

    if (schemaOrFields instanceof ArrowLikeSchema) {
      const otherArrowLikeSchema = schemaOrFields;
      fields = otherArrowLikeSchema.fields;
      metadata = mergeMaps(mergeMaps(new Map(), this.metadata), otherArrowLikeSchema.metadata);
    } else {
      fields = schemaOrFields;
    }

    // Create a merged list of fields, overwrite fields in place, new fields at end
    const fieldMap: {[key: string]: ArrowLikeField} = Object.create(null);

    for (const field of this.fields) {
      fieldMap[field.name] = field;
    }

    for (const field of fields) {
      fieldMap[field.name] = field;
    }

    const mergedFields = Object.values(fieldMap);

    return new ArrowLikeSchema(mergedFields, metadata);
  }
}

// Warn if any duplicated field names
// function checkNames(fields: Field[]): void {
//   const usedNames: Record<string, boolean> = {};
//   for (const field of fields) {
//     if (usedNames[field.name]) {
//       // eslint-disable-next-line
//       console.warn('ArrowLikeSchema: duplicated field name', field.name, field);
//     }
//     usedNames[field.name] = true;
//   }
// }

function mergeMaps<T>(m1: T, m2: T): T {
  // @ts-ignore
  return new Map([...(m1 || new Map()), ...(m2 || new Map())]);
}
