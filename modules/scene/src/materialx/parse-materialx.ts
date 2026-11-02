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
 * Parses a MaterialX XML document using the browser XML parser.
 * Preserves unknown categories, connection references and value strings.
 * Does not load includes, resolve node definitions, or evaluate shader graphs.
 */
export function parseMaterialX(text: string): MaterialXDocument {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) {
    throw new Error('MaterialX: document types and entity declarations are unsupported.');
  }
  if (typeof DOMParser === 'undefined') {
    throw new Error('MaterialX: parsing requires a browser DOMParser.');
  }
  const document = new DOMParser().parseFromString(text, 'application/xml');
  if (document.getElementsByTagName('parsererror').length) {
    throw new Error('MaterialX: malformed XML.');
  }
  const element = document.documentElement;
  if (element.tagName !== 'materialx') {
    throw new Error('MaterialX: expected a materialx root element.');
  }
  const version = element.getAttribute('version');
  if (!version || !/^1\.\d+$/.test(version)) {
    throw new Error('MaterialX: expected a MaterialX 1.x version.');
  }
  return {version, root: parseElement(element, 0)};
}

/** Converts XML elements with a bounded depth and preserves authored attribute strings. */
function parseElement(element: Element, depth: number): MaterialXElement {
  if (depth > 256) {
    throw new Error('MaterialX: maximum element depth exceeded.');
  }
  const attributes: Record<string, string> = Object.create(null);
  for (const attribute of Array.from(element.attributes)) {
    attributes[attribute.name] = attribute.value;
  }
  return {
    category: element.tagName,
    attributes,
    children: Array.from(element.children, child => parseElement(child, depth + 1))
  };
}
