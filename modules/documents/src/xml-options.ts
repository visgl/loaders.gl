// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Options for the native XML object parser. No document types or external entities are resolved. */
export type ParseXMLOptions = {
  /** Uncapitalize element and attribute keys recursively. */
  uncapitalizeKeys?: boolean;
  /** Remove namespace prefixes and namespace declaration attributes. */
  removeNSPrefix?: boolean;
  /** Field for text accompanying attributes or children. Defaults to `value`. */
  textNodeName?: string;
  /** Element paths that always produce arrays, including singleton roots. */
  arrayPaths?: string[];
  /** Prefix for attribute fields. Defaults to an empty string. */
  attributeNamePrefix?: string;
  /** Optional field containing all attributes for an element. */
  attributesGroupName?: string;
  /** Discard attributes. Defaults to false. */
  ignoreAttributes?: boolean;
  /** Convert numeric and boolean element text. Defaults to true. */
  parseTagValue?: boolean;
  /** Convert numeric and boolean attributes. Defaults to false. */
  parseAttributeValue?: boolean;
  /** Trim completed element text and attribute values. Defaults to true. */
  trimValues?: boolean;
  /** Decode entity references. Defaults to true; false preserves their authored spelling. */
  processEntities?: boolean;
  /** Recognize the SAX parser's built-in HTML named entities. Defaults to false. */
  htmlEntities?: boolean;
  /** Require well-formed XML. HTMLLoader uses false for legacy HTML-like documents. */
  strict?: boolean;
  /** Maximum open-element depth, from 1 to 4096. Defaults to 256. */
  maxDepth?: number;
  /** @deprecated Both names select the same native SAX implementation. */
  _parser?: 'internal' | 'sax';
};
