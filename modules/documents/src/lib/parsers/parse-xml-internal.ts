// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SAXParser} from '../../sax-ts/sax';
import type {ParseXMLOptions} from '../../xml-options';

/** One open XML element and its accumulated content. */
type InternalXMLNode = {
  /** Normalized element name. */
  name: string;
  /** Normalized dot-separated element path. */
  path: string;
  /** Normalized attribute values. */
  attributes: Record<string, unknown>;
  /** Completed child elements. */
  children: Record<string, unknown>;
  /** Raw concatenated text and CDATA, trimmed only when the element closes. */
  text: string;
};

/** Defines an own data property, including names such as `__proto__` and `constructor`. */
function setXMLField(object: Record<string, unknown>, name: string, value: unknown): void {
  Object.defineProperty(object, name, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
}

/** Parses an XML document using the maintained native SAX implementation. */
export function parseXMLInternal(text: string, options: ParseXMLOptions = {}): any {
  if (
    options.strict !== false &&
    /[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(text)
  ) {
    throw new Error('XML: invalid XML character');
  }
  const maximumDepth = options.maxDepth ?? 256;
  if (!Number.isSafeInteger(maximumDepth) || maximumDepth < 1 || maximumDepth > 4096) {
    throw new Error('XML: maxDepth must be an integer between 1 and 4096');
  }
  const state = new InternalXMLParserState(options, maximumDepth);
  const parser = new SAXParser({
    strict: options.strict !== false,
    strictEntities: !options.htmlEntities,
    preserveCase: true,
    caseInsensitiveTags: options.strict === false,
    processEntities: options.processEntities !== false,
    onopentag: (tag: any) => state.openElement(tag.name, tag.attributes || {}),
    ontext: (value: string) => state.addText(value),
    oncdata: (value: string) => state.addText(value),
    onscript: (value: string) => state.addText(value),
    onclosetag: () => state.closeElement(),
    onerror: (error: Error) => {
      throw error;
    }
  });
  parser.write(text).close();
  if (options.strict === false) {
    while (state.stack.length) state.closeElement();
  }
  if (state.result === undefined) throw new Error('XML: document requires a root element');
  return state.result;
}

/** Converts SAX events into an object tree using explicit native conversion options. */
class InternalXMLParserState {
  /** Open element stack. */
  readonly stack: InternalXMLNode[] = [];
  /** Parsed root document. */
  result: any;

  /** Initializes conversion options and the element nesting budget. */
  constructor(
    /** XML conversion policy. */
    readonly options: ParseXMLOptions,
    /** Maximum number of open elements. */
    readonly maximumDepth: number
  ) {}

  /** Starts an element, rejecting multiple roots and excessive nesting. */
  openElement(name: string, attributes: Record<string, string>): void {
    if (this.stack.length >= this.maximumDepth)
      throw new Error('XML: maximum nesting depth exceeded');
    if (!this.stack.length && this.result !== undefined && this.options.strict !== false) {
      throw new Error('XML: document requires a single root element');
    }
    const elementName = this.normalizeName(name);
    const parent = this.stack[this.stack.length - 1];
    this.stack.push({
      name: elementName,
      path: parent ? `${parent.path}.${elementName}` : elementName,
      attributes: this.normalizeAttributes(attributes),
      children: {},
      text: ''
    });
  }

  /** Accumulates text without losing whitespace between text and CDATA chunks. */
  addText(text: string): void {
    const current = this.stack[this.stack.length - 1];
    if (current) current.text += text;
  }

  /** Finishes an element and attaches it to its parent or the document root. */
  closeElement(): void {
    const node = this.stack.pop();
    if (!node) return;
    const value = this.finalizeElement(node);
    const parent = this.stack[this.stack.length - 1];
    if (parent) this.addChild(parent.children, node.name, node.path, value);
    else {
      if (this.result === undefined) this.result = {};
      this.addChild(this.result, node.name, node.path, value);
    }
  }

  /** Converts a completed element, keeping grouping and coercion independent. */
  private finalizeElement(node: InternalXMLNode): unknown {
    const text = this.options.trimValues === false ? node.text : node.text.trim();
    const hasAttributes = Object.keys(node.attributes).length > 0;
    if (!hasAttributes && !Object.keys(node.children).length) {
      return this.parseValue(text, this.options.parseTagValue !== false);
    }
    const object = node.children;
    if (text)
      setXMLField(
        object,
        this.options.textNodeName ?? 'value',
        this.parseValue(text, this.options.parseTagValue !== false)
      );
    if (hasAttributes && this.options.attributesGroupName) {
      setXMLField(object, this.options.attributesGroupName, node.attributes);
    } else {
      for (const [name, value] of Object.entries(node.attributes)) setXMLField(object, name, value);
    }
    return object;
  }

  /** Appends an element while preserving repeated and explicitly array-valued fields. */
  private addChild(
    object: Record<string, unknown>,
    name: string,
    path: string,
    value: unknown
  ): void {
    if (!Object.hasOwn(object, name)) {
      setXMLField(object, name, this.options.arrayPaths?.includes(path) ? [value] : value);
    } else {
      const existing = object[name];
      if (Array.isArray(existing)) existing.push(value);
      else setXMLField(object, name, [existing, value]);
    }
  }

  /** Applies namespace, prefix, grouping and scalar options to attributes. */
  private normalizeAttributes(attributes: Record<string, string>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    if (this.options.ignoreAttributes) return normalized;
    for (const [name, value] of Object.entries(attributes)) {
      if (this.options.removeNSPrefix && (name === 'xmlns' || name.startsWith('xmlns:'))) continue;
      const text = this.options.trimValues === false ? value : value.trim();
      setXMLField(
        normalized,
        (this.options.attributeNamePrefix ?? '') + this.normalizeName(name),
        this.parseValue(text, this.options.parseAttributeValue === true)
      );
    }
    return normalized;
  }

  /** Removes a namespace prefix only when requested. */
  private normalizeName(name: string): string {
    return this.options.removeNSPrefix ? name.slice(name.indexOf(':') + 1) : name;
  }

  /** Coerces only finite numeric values and lowercase XML boolean literals. */
  private parseValue(value: string, convert: boolean): unknown {
    if (!convert) return value;
    if (value === 'true' || value === 'false') return value === 'true';
    if (value !== '' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    return value;
  }
}
