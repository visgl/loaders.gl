// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {XMLParser} from 'fast-xml-parser';

import type {GraphData, GraphEdge, GraphNode} from '../graph-types';

const XML_ATTRIBUTE_PREFIX = '@_';
const XML_TEXT_KEY = '#text';

/** Supported key scopes. */
type GraphMLDomain = 'all' | 'node' | 'edge' | 'graph';

/** Supported scalar attribute types. */
type GraphMLAttributeType = 'boolean' | 'int' | 'long' | 'float' | 'double' | 'string';

/** A declared GraphML key and its default. */
type GraphMLKeyDefinition = {
  /** Key identifier. */
  id: string;
  /** Application attribute name. */
  name: string;
  /** Elements to which defaults apply. */
  domain: GraphMLDomain;
  /** Declared scalar type. */
  type: GraphMLAttributeType;
  /** Typed default value. */
  defaultValue?: unknown;
};

/** XML element representation emitted by fast-xml-parser. */
type GraphMLObject = Record<string, unknown> & {
  /** Element text content. */
  [XML_TEXT_KEY]?: string;
};

const graphmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: XML_ATTRIBUTE_PREFIX,
  textNodeName: XML_TEXT_KEY,
  trimValues: false,
  parseAttributeValue: false,
  parseTagValue: false,
  removeNSPrefix: true
});

/** Accepted GraphML document inputs. */
export type GraphMLInput = string | ArrayBuffer | Uint8Array;

/** Parses the first GraphML graph into framework-independent node and edge records. */
export function parseGraphML(graphml: GraphMLInput): GraphData {
  const xmlText = decodeGraphML(graphml);
  const document = graphmlParser.parse(xmlText) as GraphMLObject;
  const graphmlRoot = getGraphMLRoot(document);
  if (!graphmlRoot) {
    throw new Error('GraphML document does not contain a <graphml> element.');
  }

  const graphElement = getGraphElement(graphmlRoot);
  if (!graphElement) {
    throw new Error('GraphML document does not contain a <graph> element.');
  }

  const keyDefinitions = collectKeyDefinitions(graphmlRoot, graphElement);
  const defaultDirected = parseEdgeDefault(graphElement[`${XML_ATTRIBUTE_PREFIX}edgedefault`]);

  const nodes = normalizeArray(graphElement.node).map(node => parseNode(node, keyDefinitions));
  const edges = normalizeArray(graphElement.edge).map((edge, index) =>
    parseEdge(edge, index, keyDefinitions, defaultDirected)
  );

  const filteredNodes = nodes.filter((node): node is GraphNode => Boolean(node));
  const filteredEdges = edges.filter((edge): edge is GraphEdge => Boolean(edge));

  return {
    shape: 'plain-graph-data',
    nodes: filteredNodes,
    edges: filteredEdges
  } satisfies GraphData;
}

/** Decodes text or UTF-8 binary input. */
function decodeGraphML(graphml: GraphMLInput): string {
  if (typeof graphml === 'string') {
    return graphml;
  }

  if (graphml instanceof Uint8Array) {
    return new TextDecoder().decode(graphml);
  }

  if (graphml instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(graphml));
  }

  throw new Error('Unsupported GraphML input. Expected a string, ArrayBuffer, or Uint8Array.');
}

/** Finds the GraphML document root. */
function getGraphMLRoot(document: GraphMLObject): GraphMLObject | null {
  const root = document.graphml;
  if (isObject(root)) {
    return root;
  }

  return null;
}

/** Selects the first graph element. */
function getGraphElement(graphmlRoot: GraphMLObject): GraphMLObject | null {
  const graph = graphmlRoot.graph;
  if (!graph) {
    return null;
  }

  if (Array.isArray(graph)) {
    const firstGraph = graph.find(entry => isObject(entry));
    return isObject(firstGraph) ? firstGraph : null;
  }

  return isObject(graph) ? graph : null;
}

/** Collects scoped keys and typed defaults. */
function collectKeyDefinitions(
  graphmlRoot: GraphMLObject,
  graphElement: GraphMLObject
): Map<string, GraphMLKeyDefinition> {
  const keys = new Map<string, GraphMLKeyDefinition>();

  for (const candidate of [
    ...normalizeArray(graphmlRoot.key),
    ...normalizeArray(graphElement.key)
  ]) {
    if (isObject(candidate)) {
      const id = String(candidate[`${XML_ATTRIBUTE_PREFIX}id`] ?? '').trim();
      if (id) {
        const domain = normalizeDomain(candidate[`${XML_ATTRIBUTE_PREFIX}for`]);
        const name = String(candidate[`${XML_ATTRIBUTE_PREFIX}attr.name`] ?? id).trim();
        const type = normalizeType(candidate[`${XML_ATTRIBUTE_PREFIX}attr.type`]);
        const defaultNode = candidate.default ?? null;
        const defaultValue = defaultNode !== null ? castDataValue(defaultNode, type) : undefined;

        keys.set(id, {id, domain, name, type, defaultValue});
      }
    }
  }

  return keys;
}

/** Converts a node element into a graph record. */
function parseNode(
  node: unknown,
  keyDefinitions: Map<string, GraphMLKeyDefinition>
): GraphNode | null {
  if (!isObject(node)) {
    return null;
  }

  const id = node[`${XML_ATTRIBUTE_PREFIX}id`];
  if (typeof id !== 'string') {
    return null;
  }

  const attributes = buildAttributeBag('node', node.data, keyDefinitions);

  const graphNode: GraphNode = {
    id,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined
  };

  const label = attributes.label;
  if (typeof label === 'string') {
    graphNode.label = label;
  }

  return graphNode;
}

/** Converts an edge element with its effective direction. */
function parseEdge(
  edge: unknown,
  index: number,
  keyDefinitions: Map<string, GraphMLKeyDefinition>,
  defaultDirected: boolean
): GraphEdge | null {
  if (!isObject(edge)) {
    return null;
  }

  const sourceId = edge[`${XML_ATTRIBUTE_PREFIX}source`];
  const targetId = edge[`${XML_ATTRIBUTE_PREFIX}target`];
  if (typeof sourceId !== 'string') {
    return null;
  }
  if (typeof targetId !== 'string') {
    return null;
  }

  const rawId = edge[`${XML_ATTRIBUTE_PREFIX}id`];
  const id = typeof rawId === 'string' ? rawId : `edge-${index}`;
  const directed = parseDirected(edge[`${XML_ATTRIBUTE_PREFIX}directed`], defaultDirected);
  const attributes = buildAttributeBag('edge', edge.data, keyDefinitions);

  const graphEdge: GraphEdge = {
    id,
    sourceId,
    targetId,
    directed,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined
  };

  const label = attributes.label;
  if (typeof label === 'string') {
    graphEdge.label = label;
  }

  return graphEdge;
}

/** Applies scoped defaults followed by explicit data values. */
function buildAttributeBag(
  domain: GraphMLDomain,
  data: unknown,
  keyDefinitions: Map<string, GraphMLKeyDefinition>
): Record<string, unknown> {
  const attributes: Record<string, unknown> = Object.create(null);

  for (const key of keyDefinitions.values()) {
    if (key.domain === 'all' || key.domain === domain) {
      if (key.defaultValue !== undefined) {
        attributes[key.name] = key.defaultValue;
      }
    }
  }

  for (const entry of normalizeArray(data)) {
    assignAttributeFromDataEntry(entry, keyDefinitions, attributes);
  }

  return attributes;
}

/** Assigns a data value using its declared key or original key ID. */
function assignAttributeFromDataEntry(
  entry: unknown,
  keyDefinitions: Map<string, GraphMLKeyDefinition>,
  attributes: Record<string, unknown>
): void {
  if (!isObject(entry)) {
    return;
  }

  const keyId = entry[`${XML_ATTRIBUTE_PREFIX}key`];
  if (typeof keyId !== 'string') {
    return;
  }

  const definition = keyDefinitions.get(keyId);
  const attributeName = definition?.name ?? keyId;
  const value =
    definition?.type === 'boolean' && extractTextContent(entry) === undefined
      ? false
      : castDataValue(entry, definition?.type ?? 'string');
  if (value !== undefined) {
    attributes[attributeName] = value;
  }
}

/** Converts GraphML scalar types while preserving unparseable numeric text. */
function castDataValue(value: unknown, type: GraphMLAttributeType): unknown {
  if (value === null || typeof value === 'undefined') {
    return undefined;
  }

  const text = extractTextContent(value);
  if (text === undefined) {
    return undefined;
  }

  if (type === 'boolean') {
    return parseBoolean(text);
  }
  if (type === 'int' || type === 'long') {
    const parsed = Number.parseInt(text, 10);
    return Number.isNaN(parsed) ? text : parsed;
  }
  if (type === 'float' || type === 'double') {
    const parsed = Number.parseFloat(text);
    return Number.isNaN(parsed) ? text : parsed;
  }
  return text;
}

/** Extracts scalar text or serializes structured vendor data. */
function extractTextContent(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return extractTextContent(value[0]);
  }

  if (isObject(value)) {
    const text = value[XML_TEXT_KEY];
    const nonAttributeEntries = Object.entries(value).filter(
      ([key]) => !key.startsWith(XML_ATTRIBUTE_PREFIX) && key !== XML_TEXT_KEY
    );
    if (nonAttributeEntries.length === 0) {
      return typeof text === 'string' ? text : undefined;
    }
    if (typeof text === 'string' && text.trim()) {
      nonAttributeEntries.push([XML_TEXT_KEY, text]);
    }
    return JSON.stringify(Object.fromEntries(nonAttributeEntries));
  }

  return undefined;
}

/** Normalizes singleton and repeated XML elements. */
function normalizeArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/** Tests whether a value is an XML element object. */
function isObject(value: unknown): value is GraphMLObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Normalizes a key scope, defaulting to all elements. */
function normalizeDomain(value: unknown): GraphMLDomain {
  if (typeof value !== 'string') {
    return 'all';
  }

  const lower = value.toLowerCase();
  if (lower === 'node' || lower === 'edge' || lower === 'graph' || lower === 'all') {
    return lower;
  }
  return 'all';
}

/** Normalizes supported GraphML scalar types. */
function normalizeType(value: unknown): GraphMLAttributeType {
  if (typeof value !== 'string') {
    return 'string';
  }

  const lower = value.toLowerCase();
  if (
    lower === 'boolean' ||
    lower === 'int' ||
    lower === 'long' ||
    lower === 'float' ||
    lower === 'double'
  ) {
    return lower;
  }
  return 'string';
}

/** Converts an edge element with its effective direction. */
/** Reads the graph-wide default edge direction. */
function parseEdgeDefault(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() !== 'undirected';
}

/** Reads an edge direction override. */
function parseDirected(value: unknown, defaultDirected: boolean): boolean {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'directed'
    ) {
      return true;
    }
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'undirected'
    ) {
      return false;
    }
  }
  return defaultDirected;
}

/** Converts common boolean spellings. */
function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'n') {
    return false;
  }
  return Boolean(normalized);
}
