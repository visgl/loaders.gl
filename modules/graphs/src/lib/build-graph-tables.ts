// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Bool,
  Float32,
  Float64,
  Int32,
  Int64,
  Utf8,
  Struct,
  List,
  Field,
  Table,
  vectorFromArray
} from 'apache-arrow';
import type {DataType, Vector} from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import type {
  GraphNode,
  GraphEdge,
  GraphOutput,
  GraphShape,
  GraphAttributeSchemas,
  GraphAttributeType
} from '../graph-types';

/** Constructs named tables without materializing an intermediate plain graph. */
export function buildGraphTables(
  nodes: Iterable<GraphNode>,
  edges: Iterable<GraphEdge>,
  shape: GraphShape,
  declarations?: GraphAttributeSchemas
): GraphOutput {
  if (shape === 'plain-graph-data') {
    return {shape, nodes: Array.from(nodes), edges: Array.from(edges)};
  }
  if (shape !== 'arrow-table' && shape !== 'object-row-table') {
    throw new Error(`Unsupported graph shape: ${shape}`);
  }
  const nodeTable = buildGraphTable(nodes, false, shape, declarations?.nodes);
  const edgeTable = buildGraphTable(edges, true, shape, declarations?.edges);
  // Both tables always have the same representation.
  return {
    shape: 'tables',
    tables: [
      {name: 'nodes', table: nodeTable},
      {name: 'edges', table: edgeTable}
    ]
  } as GraphOutput;
}

/** Builds structural columns and a collision-free application attribute struct. */
function buildGraphTable(
  records: Iterable<GraphNode | GraphEdge>,
  isEdge: boolean,
  shape: 'arrow-table' | 'object-row-table',
  declarations?: Map<string, GraphAttributeType>
): ArrowTable | ObjectRowTable {
  const columnNames = isEdge
    ? ['id', 'sourceId', 'targetId', 'directed', 'label', 'attributes']
    : ['id', 'label', 'attributes'];
  const columns = new Map<string, unknown[]>(columnNames.map(name => [name, []]));
  for (const record of records) {
    for (const name of columnNames) {
      const value = (record as unknown as Record<string, unknown>)[name];
      columns
        .get(name)!
        .push(
          name === 'id' || name === 'sourceId' || name === 'targetId'
            ? String(value)
            : (value ?? null)
        );
    }
  }
  if (shape === 'object-row-table') {
    return {
      shape,
      data: columns
        .get('id')!
        .map((_, index) =>
          Object.fromEntries(columnNames.map(name => [name, columns.get(name)![index]]))
        )
    };
  }
  const vectors: Record<string, Vector> = Object.create(null);
  for (const [name, values] of columns) {
    const type =
      name === 'attributes'
        ? inferAttributeType(values, declarations)
        : name === 'directed'
          ? new Bool()
          : new Utf8();
    vectors[name] = vectorFromArray(
      values.map(value => normalizeValue(value, type)),
      type
    );
  }
  const data = new Table(vectors);
  return {shape, schema: convertArrowToSchema(data.schema), data};
}

/** Infers a struct using the union of declared and observed application keys. */
function inferAttributeType(
  values: unknown[],
  declarations?: Map<string, GraphAttributeType>
): Struct {
  const names = new Set(declarations?.keys());
  for (const value of values) {
    if (value && typeof value === 'object') {
      for (const name of Object.keys(value)) {
        names.add(name);
      }
    }
  }
  return new Struct(
    Array.from(names, name => {
      const fieldValues = values.map(
        value => (value as Record<string, unknown> | null)?.[name] ?? null
      );
      return new Field(name, inferValueType(fieldValues, declarations?.get(name)), true);
    })
  );
}

/** Preserves declared scalar types where valid and infers nested DOT attributes. */
function inferValueType(values: unknown[], declaration?: GraphAttributeType): DataType {
  const present = values.filter(value => value !== null && value !== undefined);
  if (declaration) {
    const declaredTypes = {
      boolean: new Bool(),
      int: new Int32(),
      long: new Int64(),
      float: new Float32(),
      double: new Float64(),
      string: new Utf8()
    };
    const valid = present.every(value => {
      switch (declaration) {
        case 'boolean':
          return typeof value === 'boolean';
        case 'int':
          return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= -2147483648 &&
            value <= 2147483647
          );
        case 'long':
          return typeof value === 'bigint' && value >= -(2n ** 63n) && value < 2n ** 63n;
        case 'float':
        case 'double':
          return typeof value === 'number';
        case 'string':
          return typeof value === 'string';
      }
    });
    return valid ? declaredTypes[declaration] : new Utf8();
  }
  if (present.length && present.every(value => typeof value === 'boolean')) return new Bool();
  if (present.length && present.every(value => typeof value === 'number')) return new Float64();
  if (present.length && present.every(value => Array.isArray(value))) {
    return new List(
      new Field('item', inferValueType(present.flatMap(value => value as unknown[])), true)
    );
  }
  if (
    present.length &&
    present.every(value => typeof value === 'object' && !Array.isArray(value))
  ) {
    return inferAttributeType(present);
  }
  return new Utf8();
}

/** Normalizes missing fields and mixed values for the selected Arrow type. */
function normalizeValue(value: unknown, type: DataType): unknown {
  if (value === null || value === undefined) return null;
  if (type instanceof Struct) {
    return Object.fromEntries(
      type.children.map(field => [
        field.name,
        normalizeValue((value as Record<string, unknown>)[field.name], field.type)
      ])
    );
  }
  if (type instanceof List)
    return (value as unknown[]).map(item => normalizeValue(item, type.valueType));
  if (type instanceof Utf8 && typeof value !== 'string') {
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
  return value;
}
