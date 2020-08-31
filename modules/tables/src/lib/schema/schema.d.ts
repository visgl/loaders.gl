import Field from './field';

/**
 * ArrowJS `Schema` API-compatible class for row-based tables (returned from `DataTable`)
 * https://loaders.gl/arrowjs/docs/api-reference/schema
 */
export default class Schema {
  fields: Field[];
  // TODO - Arrow just allows Map<string, string>
  metadata: Map<string, any>;

  constructor(fields: Field[], metadata?: Map<string, any> | null);

  compareTo(other: Schema): boolean;
  select(...columnNames: string[]): Schema;
  selectAt(...columnIndices: number[]): Schema;
  assign(schema: Schema): Schema;
  assign(...fields: Field[]): Schema;
}
