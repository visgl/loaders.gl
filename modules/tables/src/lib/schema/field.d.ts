import {DataType} from '../types/arrow-like/type';

/**
 * ArrowJS `Field` API-compatible class for row-based tables
 * https://loaders.gl/arrowjs/docs/api-reference/field
 */
export default class Field {
  constructor(name: string, type: DataType, nullable?: boolean, metadata?: Map<string, string>);

  compareTo(other: Field): boolean;
  clone(): Field;

  name: string;
  type: DataType;
  nullable: boolean;
  metadata: Map<string, string>;

  readonly typeId: number;

  toString(): string;
}
