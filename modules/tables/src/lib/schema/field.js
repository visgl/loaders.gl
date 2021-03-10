import {assert} from '../utils/assert';
import {DataType} from '../types/arrow-like/type';

// ArrowJS `Schema` API-compatible class for row-based tables (returned from `DataTable`)
// https://loaders.gl/arrowjs/docs/api-reference/field
// A field holds name, nullable, and metadata information about a table "column"
// A Schema is essentially a list of fields

export default class Field {
  constructor(name, type = null, nullable = false, metadata = new Map()) {
    assert(typeof name === 'string');
    assert(!type || type instanceof DataType);
    assert(typeof nullable === 'boolean');
    assert(!metadata || typeof metadata === 'object');

    this.name = name;
    this.type = type;
    this.nullable = nullable;
    this.metadata = metadata;
  }

  get typeId() {
    return this.type && this.type.typeId;
  }

  clone() {
    return new Field(this.name, this.type, this.nullable, this.metadata);
  }

  compareTo(other) {
    return (
      this.name === other.name &&
      this.type === other.type &&
      this.nullable === other.nullable &&
      this.metadata === other.metadata
    );
  }

  toString() {
    return `${this.type}${this.nullable ? ', nullable' : ''}${
      this.metadata ? `, metadata: ${this.metadata}` : ''
    }`;
  }
}
