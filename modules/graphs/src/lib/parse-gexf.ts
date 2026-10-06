// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {XMLParser, XMLValidator} from 'fast-xml-parser';
import type {GraphNode, GraphEdge, GraphShape, GraphAttributeType} from '../graph-types';
import type {GEXFOutput} from '../gexf-types';
import {buildGraphTables} from './build-graph-tables';

/** XML element and attribute representation. */
type XMLElement = Record<string, unknown>;

/** A scoped application attribute declaration. */
type AttributeDefinition = {
  /** Application attribute title. */
  name: string;
  /** Arrow-compatible scalar or list type. */
  type: GraphAttributeType;
  /** Default value, when supplied. */
  defaultValue?: unknown;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: false
});
const GEXF_NAMESPACE = /^https?:\/\/(?:www\.)?gexf.net\/1\.(?:2(?:draft)?|3)(\/viz)?$/;
const TEMPORAL_ATTRIBUTES = [
  'start',
  'end',
  'startopen',
  'endopen',
  'timestamp',
  'timestamps',
  'intervals'
];

/** Parses a static GEXF document directly into the selected graph representation. */
export function parseGEXF(
  input: string | ArrayBuffer | Uint8Array,
  shape: GraphShape = 'arrow-table'
): GEXFOutput {
  const text = typeof input === 'string' ? input : new TextDecoder().decode(input);
  const validation = XMLValidator.validate(text);
  if (validation !== true) throw new Error(`Invalid GEXF XML: ${validation.err.msg}`);
  // External and custom entity declarations are outside the supported format subset.
  if (/<!DOCTYPE\s/i.test(text)) throw new Error('GEXF document types are unsupported.');
  const document = normalizeNamespaces(parser.parse(text) as XMLElement, {});
  const root = getElement(document.gexf, 'gexf');
  const version = root['@_version'] as string | undefined;
  if (version && !['1.2', '1.2draft', '1.3'].includes(version)) {
    throw new Error(`Unsupported GEXF version: ${version}`);
  }
  const graph = getElement(root.graph, 'graph');
  const directed = parseDirection(graph['@_defaultedgetype'] ?? 'undirected');
  const definitions = {
    nodes: new Map<string, AttributeDefinition>(),
    edges: new Map<string, AttributeDefinition>()
  };
  for (const attributes of getElements(graph.attributes)) {
    const domain = attributes['@_class'];
    if (domain !== 'node' && domain !== 'edge')
      throw new Error('GEXF attributes require a node or edge class.');
    const scoped = domain === 'node' ? definitions.nodes : definitions.edges;
    const names = new Set(Array.from(scoped.values(), definition => definition.name));
    for (const attribute of getElements(attributes.attribute)) {
      const identifier = requireAttribute(attribute, 'id');
      const name = requireAttribute(attribute, 'title');
      if (name === 'gexf' || names.has(name) || scoped.has(identifier)) {
        throw new Error(`Duplicate or reserved GEXF attribute: ${name}`);
      }
      names.add(name);
      const type = parseAttributeType(requireAttribute(attribute, 'type'));
      scoped.set(identifier, {
        name,
        type,
        defaultValue:
          attribute.default === undefined ? undefined : castValue(String(attribute.default), type)
      });
    }
  }
  const nodeElements = getElements(getContainer(graph.nodes).node);
  const edgeElements = getElements(getContainer(graph.edges).edge);
  const nodeIdentifiers = new Set<string>();
  for (const node of nodeElements) {
    const identifier = requireAttribute(node, 'id');
    if (nodeIdentifiers.has(identifier)) throw new Error(`Duplicate GEXF node ID: ${identifier}`);
    nodeIdentifiers.add(identifier);
  }
  const edgeIdentifiers = new Set(
    edgeElements
      .map(edge => edge['@_id'])
      .filter((identifier): identifier is string => typeof identifier === 'string')
  );
  const seenEdges = new Set<string>();
  /** Emits node records directly to the table builder. */
  function* iterateNodes(): Iterable<GraphNode> {
    for (const node of nodeElements) yield parseRecord(node, definitions.nodes);
  }
  /** Emits edge records without materializing a plain graph. */
  function* iterateEdges(): Iterable<GraphEdge> {
    for (const [index, edge] of edgeElements.entries()) {
      const sourceId = requireAttribute(edge, 'source');
      const targetId = requireAttribute(edge, 'target');
      if (!nodeIdentifiers.has(sourceId) || !nodeIdentifiers.has(targetId)) {
        throw new Error('GEXF edge references an undeclared node.');
      }
      let identifier = edge['@_id'] === undefined ? undefined : requireAttribute(edge, 'id');
      if (identifier === undefined) {
        identifier = `edge-${index}`;
        while (edgeIdentifiers.has(identifier)) identifier = `_${identifier}`;
        edgeIdentifiers.add(identifier);
      }
      if (seenEdges.has(identifier)) throw new Error(`Duplicate GEXF edge ID: ${identifier}`);
      seenEdges.add(identifier);
      yield {
        ...parseRecord(edge, definitions.edges, identifier),
        sourceId,
        targetId,
        directed: edge['@_type'] === undefined ? directed : parseDirection(edge['@_type'])
      };
    }
  }
  const metadataAttributes: Record<string, string> = Object.create(null);
  const meta = getContainer(root.meta);
  for (const name of ['creator', 'description', 'keywords']) {
    if (typeof meta[name] === 'string') metadataAttributes[name] = meta[name];
  }
  if (typeof meta['@_lastmodifieddate'] === 'string')
    metadataAttributes.lastmodifieddate = meta['@_lastmodifieddate'];
  const declarations = {
    nodes: new Map(
      Array.from(definitions.nodes.values(), definition => [definition.name, definition.type])
    ),
    edges: new Map(
      Array.from(definitions.edges.values(), definition => [definition.name, definition.type])
    )
  };
  return {
    ...buildGraphTables(iterateNodes(), iterateEdges(), shape, declarations),
    metadata: {version, directed, attributes: metadataAttributes}
  };
}

/** Resolves inherited namespace bindings without treating foreign elements as GEXF. */
function normalizeNamespaces(element: XMLElement, inherited: Record<string, string>): XMLElement {
  const namespaces = {...inherited};
  for (const [name, value] of Object.entries(element)) {
    if (name === '@_xmlns') namespaces[''] = String(value);
    else if (name.startsWith('@_xmlns:')) namespaces[name.slice(8)] = String(value);
  }
  const normalized: XMLElement = Object.create(null);
  for (const [name, value] of Object.entries(element)) {
    if (name.startsWith('@_') || name === '#text' || name.startsWith('?')) {
      normalized[name] = value;
      continue;
    }
    const separator = name.indexOf(':');
    const prefix = separator < 0 ? '' : name.slice(0, separator);
    const localName = name.slice(separator + 1);
    // Namespace declarations on this child also scope the child's own name.
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      const object = typeof child === 'object' && child !== null ? (child as XMLElement) : {};
      const namespace = object[prefix ? `@_xmlns:${prefix}` : '@_xmlns'] ?? namespaces[prefix];
      const match = typeof namespace === 'string' ? GEXF_NAMESPACE.exec(namespace) : null;
      const key = match
        ? `${match[1] ? 'viz:' : ''}${localName}`
        : namespace || prefix
          ? `foreign:${name}`
          : localName;
      const childValue =
        typeof child === 'object' && child !== null
          ? match || (!namespace && !prefix)
            ? normalizeNamespaces(object, namespaces)
            : object
          : child;
      if (normalized[key] === undefined) normalized[key] = childValue;
      else
        normalized[key] = [
          ...(Array.isArray(normalized[key]) ? (normalized[key] as unknown[]) : [normalized[key]]),
          childValue
        ];
    }
  }
  assertStaticElement(normalized);
  return normalized;
}

/** Rejects temporal and hierarchical constructs that flat static tables cannot represent. */
function assertStaticElement(element: XMLElement): void {
  if (
    (element['@_mode'] !== undefined && element['@_mode'] !== 'static') ||
    TEMPORAL_ATTRIBUTES.some(name => element[`@_${name}`] !== undefined) ||
    element.spells !== undefined
  ) {
    throw new Error('Dynamic GEXF graphs and temporal values are unsupported.');
  }
  if (
    element['@_pid'] !== undefined ||
    element.parents !== undefined ||
    (element['@_id'] !== undefined && (element.nodes !== undefined || element.edges !== undefined))
  ) {
    throw new Error('Hierarchical GEXF graphs are unsupported.');
  }
}

/** Reads a singleton element, including an empty element. */
function getElement(value: unknown, name: string): XMLElement {
  if (value === '') return {};
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as XMLElement;
  throw new Error(`GEXF requires one <${name}> element.`);
}

/** Reads an optional container while rejecting repeated containers. */
function getContainer(value: unknown): XMLElement {
  return value === undefined ? {} : getElement(value, 'container');
}

/** Reads repeated or singleton element records. */
function getElements(value: unknown): XMLElement[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map(entry => getElement(entry, 'record'));
}

/** Reads a required XML attribute without changing identifier or label whitespace. */
function requireAttribute(element: XMLElement, name: string): string {
  const value = element[`@_${name}`];
  if (typeof value !== 'string' || value === '')
    throw new Error(`GEXF requires a ${name} attribute.`);
  return value;
}

/** Reads a direction while rejecting bidirectional mutual edges. */
function parseDirection(value: unknown): boolean {
  if (value !== 'directed' && value !== 'undirected')
    throw new Error(`Unsupported GEXF edge type: ${String(value)}`);
  return value === 'directed';
}

/** Maps supported GEXF scalar and list types to graph column declarations. */
function parseAttributeType(value: string): GraphAttributeType {
  if (value.startsWith('list') && !value.slice(4).startsWith('list')) {
    return {list: parseAttributeType(value.slice(4))};
  }
  if (value === 'integer' || value === 'byte' || value === 'short') return 'int';
  if (value === 'boolean' || value === 'long' || value === 'float' || value === 'double')
    return value;
  if (['string', 'anyURI', 'date', 'char', 'bigdecimal', 'biginteger'].includes(value))
    return 'string';
  throw new Error(`Unsupported GEXF attribute type: ${value}`);
}

/** Casts exact declared values; invalid scalar text survives Arrow promotion to Utf8. */
function castValue(text: string, type: GraphAttributeType): unknown {
  if (typeof type === 'object') {
    return parseListValues(text).map(value => castValue(value, type.list));
  }
  if (type === 'string') return text;
  const trimmed = text.trim();
  if (type === 'boolean') {
    if (trimmed === 'true' || trimmed === '1') return true;
    if (trimmed === 'false' || trimmed === '0') return false;
    return text;
  }
  if (type === 'int' || type === 'long') {
    if (!/^[+-]?\d+$/.test(trimmed)) return text;
    return type === 'long'
      ? BigInt(trimmed)
      : Number.isSafeInteger(Number(trimmed))
        ? Number(trimmed)
        : text;
  }
  if (trimmed === 'INF') return Infinity;
  if (trimmed === '-INF') return -Infinity;
  if (trimmed === 'NaN') return NaN;
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed) ? Number(trimmed) : text;
}

/** Reads bracketed and legacy lists, preserving quoted delimiters and string whitespace. */
function parseListValues(text: string): string[] {
  const trimmed = text.trim();
  const bracketed = trimmed.startsWith('[');
  if (bracketed !== trimmed.endsWith(']')) throw new Error('Invalid GEXF list brackets.');
  const contents = bracketed ? trimmed.slice(1, -1) : trimmed;
  if (!contents.trim()) return [];
  const values: string[] = [];
  let value = '';
  let quote = '';
  let quoted = false;
  let closed = false;
  for (let index = 0; index < contents.length; index++) {
    const character = contents[index];
    if (quote) {
      if (character === '\\' && (contents[index + 1] === quote || contents[index + 1] === '\\')) {
        value += contents[++index];
      } else if (character === quote) {
        quote = '';
        closed = true;
      } else value += character;
    } else if (character === ',' || (!bracketed && (character === '|' || character === ';'))) {
      values.push(quoted ? value : value.trim());
      value = '';
      quoted = false;
      closed = false;
    } else if (closed) {
      if (character.trim()) throw new Error('Invalid GEXF list text after a quote.');
    } else if ((character === "'" || character === '"') && !value.trim()) {
      quote = character;
      quoted = true;
      value = '';
    } else value += character;
  }
  if (quote) throw new Error('Unterminated GEXF list quote.');
  values.push(quoted ? value : value.trim());
  return values;
}

/** Converts application attributes and native GEXF properties to a collision-free record. */
function parseRecord(
  element: XMLElement,
  definitions: Map<string, AttributeDefinition>,
  identifier?: string
): GraphNode {
  const attributes: Record<string, unknown> = Object.create(null);
  for (const definition of definitions.values()) {
    if (definition.defaultValue !== undefined)
      attributes[definition.name] = Array.isArray(definition.defaultValue)
        ? [...definition.defaultValue]
        : definition.defaultValue;
  }
  for (const attvalue of getElements(getContainer(element.attvalues).attvalue)) {
    const key = requireAttribute(attvalue, 'for');
    const definition = definitions.get(key);
    if (!definition) throw new Error(`Undeclared GEXF attribute: ${key}`);
    attributes[definition.name] = castValue(requireValue(attvalue), definition.type);
  }
  const native: Record<string, unknown> = Object.create(null);
  if (element['@_weight'] !== undefined)
    native.weight = castValue(String(element['@_weight']), 'double');
  if (element['@_kind'] !== undefined) native.kind = element['@_kind'];
  const visualization: Record<string, unknown> = Object.create(null);
  for (const name of ['color', 'position', 'size', 'shape', 'thickness']) {
    const value = element[`viz:${name}`];
    if (value === undefined) continue;
    const properties: Record<string, unknown> = Object.create(null);
    for (const [key, property] of Object.entries(getElement(value, `viz:${name}`))) {
      if (key.startsWith('@_') && !key.startsWith('@_xmlns')) {
        const propertyName = key.slice(2);
        properties[propertyName] =
          ['r', 'g', 'b', 'a', 'x', 'y', 'z'].includes(propertyName) ||
          (propertyName === 'value' && (name === 'size' || name === 'thickness'))
            ? castValue(String(property), 'double')
            : property;
      }
    }
    visualization[name] = properties;
  }
  if (Object.keys(visualization).length) native.viz = visualization;
  if (Object.keys(native).length) attributes.gexf = native;
  return {
    id: identifier ?? requireAttribute(element, 'id'),
    label: element['@_label'] as string | undefined,
    attributes
  };
}

/** Reads an attribute value, allowing the empty string. */
function requireValue(element: XMLElement): string {
  const value = element['@_value'];
  if (typeof value !== 'string') throw new Error('GEXF attvalue requires a value attribute.');
  return value;
}
