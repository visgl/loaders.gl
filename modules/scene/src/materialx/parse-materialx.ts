import {parseXMLSync} from '@loaders.gl/documents/xml-parser';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/** Authored MaterialX element, including extension categories and connection attributes. */
export interface MaterialXElement {
  /** XML element category, for example nodegraph, input, or multiply. */
  category: string;
  /** Authored string attributes; values are not coerced or evaluated. */
  attributes: Record<string, string>;
  /** Child elements in document order. */
  children: MaterialXElement[];
}

/** Parsed MaterialX document. External includes remain unresolved. */
export interface MaterialXDocument {
  /** Authored MaterialX version. */
  version: string;
  /** MaterialX root element. */
  root: MaterialXElement;
}

/**
 * Parses a MaterialX XML document using the native documents XML parser.
 * Preserves unknown categories, connection references and value strings.
 * Does not load includes, resolve node definitions, or evaluate shader graphs.
 */
export function parseMaterialX(text: string): MaterialXDocument {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) {
    throw new Error('MaterialX: document types and entity declarations are unsupported.');
  }
  let element: OrderedXMLElement;
  try {
    element = parseXMLSync(text, {
      preserveOrder: true,
      parseAttributeValue: false,
      trimValues: false
    });
  } catch (error) {
    throw new Error('MaterialX: malformed XML.', {cause: error});
  }
  if (element.name !== 'materialx') {
    throw new Error('MaterialX: expected a materialx root element.');
  }
  const version = element.attributes.version;
  if (!version || !/^1\.\d+$/.test(version)) {
    throw new Error('MaterialX: expected a MaterialX 1.x version.');
  }
  return {version, root: parseElement(element, 0)};
}

/** Ordered element representation returned by the XML parser. */
interface OrderedXMLElement {
  /** XML element name. */
  name: string;
  /** Authored string attributes. */
  attributes: Record<string, string>;
  /** Ordered child elements. */
  children: OrderedXMLElement[];
}

/** Converts the native XML tree to MaterialX categories. */
function parseElement(element: OrderedXMLElement, depth: number): MaterialXElement {
  return {
    category: element.name,
    attributes: element.attributes,
    children: element.children.map(child => parseElement(child, depth + 1))
  };
}
