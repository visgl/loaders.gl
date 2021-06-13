import {DataType} from './type';

/**
 * ArrowJS `Field` API-compatible class for row-based tables
 * https://loaders.gl/arrowjs/docs/api-reference/field
 * A field holds name, nullable, and metadata information about a table "column"
 * A Schema is essentially a list of fields
 */
export default class Field {
  name: string;
  type: DataType;
  nullable: boolean;
  metadata: Map<string, string>;

  constructor(
    name: string,
    type: DataType,
    nullable = false,
    metadata: Map<string, string> = new Map()
  ) {
    this.name = name;
    this.type = type;
    this.nullable = nullable;
    this.metadata = metadata;
  }

  get typeId(): number {
    return this.type && this.type.typeId;
  }

  clone(): Field {
    return new Field(this.name, this.type, this.nullable, this.metadata);
  }

  compareTo(other: this): boolean {
    return (
      this.name === other.name &&
      this.type === other.type &&
      this.nullable === other.nullable &&
      this.metadata === other.metadata
    );
  }

  toString(): string {
    return `${this.type}${this.nullable ? ', nullable' : ''}${
      this.metadata ? `, metadata: ${this.metadata}` : ''
    }`;
  }
}
