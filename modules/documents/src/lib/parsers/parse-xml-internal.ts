// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SAXParser} from '../../sax-ts/sax';
import type {ParseXMLOptions} from './parse-xml';

type InternalXMLNode = {
  /** Normalized tag name. */
  name: string;
  /** Dot-separated element path, used to apply arrayPaths. */
  path: string;
  /** XML attributes normalized into XMLLoader fields. */
  attributes: Record<string, unknown>;
  /** Child elements normalized into XMLLoader fields. */
  children: Record<string, unknown>;
  /** Concatenated text and CDATA for this element. */
  text: string;
};

/**
 * Parse XML to the same JavaScript-friendly object shape as XMLLoader's default parser.
 */
export function parseXMLInternal(text: string, options: ParseXMLOptions = {}): any {
  const state = new InternalXMLParserState(options);
  const parser = new SAXParser({
    strict: true,
    onopentag: (tag: any) => state.openElement(tag.name, tag.attributes || {}),
    ontext: (nodeText: string) => state.addText(nodeText),
    oncdata: (cdataText: string) => state.addText(cdataText),
    onclosetag: () => state.closeElement(),
    onerror: (error: Error) => {
      throw error;
    }
  });

  parser.write(text).close();
  return state.result;
}

/** Converts SAX parser events into the XMLLoader object representation. */
class InternalXMLParserState {
  /** XML parse options. */
  readonly options: ParseXMLOptions;
  /** Open element stack. */
  readonly stack: InternalXMLNode[] = [];
  /** Final root result. */
  result: any;

  /** Create parser state from XML parse options. */
  constructor(options: ParseXMLOptions) {
    this.options = options;
  }

  /** Start a new element. */
  openElement(name: string, attributes: Record<string, string>): void {
    const elementName = this.normalizeName(name);
    const parent = this.stack[this.stack.length - 1];
    const path = parent ? `${parent.path}.${elementName}` : elementName;

    this.stack.push({
      name: elementName,
      path,
      attributes: this.normalizeAttributes(attributes),
      children: {},
      text: ''
    });
  }

  /** Add text or CDATA content to the current element. */
  addText(text: string): void {
    const currentElement = this.stack[this.stack.length - 1];
    const trimmedText = text.trim();

    if (currentElement && trimmedText) {
      currentElement.text += trimmedText;
    }
  }

  /** Finalize the current element and append it to its parent. */
  closeElement(): void {
    const node = this.stack.pop();
    if (!node) {
      return;
    }

    const value = this.finalizeElement(node);
    const parent = this.stack[this.stack.length - 1];

    if (parent) {
      this.addChild(parent, node.name, node.path, value);
    } else {
      this.result = {[node.name]: value};
    }
  }

  /** Convert an open element node into its public value. */
  private finalizeElement(node: InternalXMLNode): unknown {
    const hasAttributes = Object.keys(node.attributes).length > 0;
    const hasChildren = Object.keys(node.children).length > 0;
    const hasText = node.text.length > 0;

    if (!hasAttributes && !hasChildren) {
      return hasText ? this.parseValue(node.text) : '';
    }

    const object: Record<string, unknown> = {...node.children};

    if (hasText) {
      object[this.options.textNodeName || 'value'] = this.parseValue(node.text);
    }

    Object.assign(object, node.attributes);
    return object;
  }

  /** Append a child element value, promoting repeated names to arrays. */
  private addChild(parent: InternalXMLNode, name: string, path: string, value: unknown): void {
    const existingValue = parent.children[name];
    const shouldBeArray = Boolean(this.options.arrayPaths?.some(arrayPath => arrayPath === path));

    if (existingValue === undefined) {
      parent.children[name] = shouldBeArray ? [value] : value;
    } else if (Array.isArray(existingValue)) {
      existingValue.push(value);
    } else {
      parent.children[name] = [existingValue, value];
    }
  }

  /** Normalize all attributes for an element. */
  private normalizeAttributes(attributes: Record<string, string>): Record<string, unknown> {
    const normalizedAttributes: Record<string, unknown> = {};

    for (const [name, value] of Object.entries(attributes)) {
      if (this.options.removeNSPrefix && name.startsWith('xmlns')) {
        continue;
      }
      normalizedAttributes[this.normalizeName(name)] = this.parseAttributeValue(value);
    }

    return normalizedAttributes;
  }

  /** Normalize XML tag or attribute names according to namespace options. */
  private normalizeName(name: string): string {
    if (!this.options.removeNSPrefix) {
      return name;
    }

    const separatorIndex = name.indexOf(':');
    return separatorIndex === -1 ? name : name.slice(separatorIndex + 1);
  }

  /** Parse attribute values only when the fast-xml-parser compatibility option requests it. */
  private parseAttributeValue(value: string): unknown {
    return this.options._fastXML?.parseAttributeValue ? this.parseValue(value) : value;
  }

  /** Parse text node values unless the fast-xml-parser compatibility option disables it. */
  private parseValue(value: string): unknown {
    if (this.options._fastXML?.parseTagValue === false) {
      return value;
    }

    if (/^(?:true|false)$/i.test(value)) {
      return value.toLowerCase() === 'true';
    }

    if (value !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }

    return value;
  }
}
