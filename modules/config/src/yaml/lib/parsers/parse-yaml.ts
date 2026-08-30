// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {YAMLParseOptions} from '../../yaml-loader-options';

/** Parses a YAML document into its JavaScript representation. */
export function parseYAMLSync(text: string, options?: YAMLParseOptions): unknown {
  return new YAMLParser(text, options).parse();
}

type YAMLMapping = Record<string, unknown>;

type YAMLLine = {
  indent: number;
  content: string;
  blank?: boolean;
};

/** Small dependency-free YAML parser for common YAML 1.1 and 1.2 documents. */
class YAMLParser {
  private readonly lines: YAMLLine[];
  private readonly options: YAMLParseOptions;
  private readonly anchors = new Map<string, unknown>();
  private lineIndex = 0;

  /** Creates a parser for one YAML document. */
  constructor(text: string, options: YAMLParseOptions = {}) {
    this.options = options;
    this.lines = this.createLines(text);
  }

  /** Parses the document root. */
  parse(): unknown {
    this.skipBlankLines();
    if (this.lineIndex >= this.lines.length) {
      return null;
    }
    const value = this.parseBlock(this.lines[this.lineIndex].indent);
    this.skipBlankLines();
    if (this.lineIndex < this.lines.length) {
      throw this.error('Unexpected content', this.lineIndex);
    }
    return value;
  }

  /** Converts source text to indentation-aware logical lines. */
  private createLines(text: string): YAMLLine[] {
    const sourceLines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    const lines: YAMLLine[] = [];
    for (const sourceLine of sourceLines) {
      const leadingWhitespace = sourceLine.match(/^ */)?.[0].length ?? 0;
      const content = this.stripComment(sourceLine.slice(leadingWhitespace)).trimEnd();
      if (!content) {
        lines.push({indent: leadingWhitespace, content: '', blank: true});
        continue;
      }
      if (content === '---' || content === '...') {
        continue;
      }
      if (/\t/.test(sourceLine.slice(0, leadingWhitespace))) {
        throw new Error('YAML does not allow tabs for indentation');
      }
      lines.push({indent: leadingWhitespace, content});
    }
    return lines;
  }

  /** Parses a sequence or mapping at the requested indentation. */
  private parseBlock(indent: number): unknown {
    this.skipBlankLines();
    const line = this.lines[this.lineIndex];
    if (!line || line.indent < indent) {
      return null;
    }
    if (line.indent !== indent) {
      throw this.error('Unexpected indentation', this.lineIndex);
    }
    if (line.content === '-' || line.content.startsWith('- ')) {
      return this.parseSequence(indent);
    }
    if (this.findMappingSeparator(line.content) >= 0) {
      return this.parseMapping(indent);
    }
    this.lineIndex++;
    return this.parseValue(line.content, indent);
  }

  /** Parses a block sequence. */
  private parseSequence(indent: number): unknown[] {
    const values: unknown[] = [];
    while (this.lineIndex < this.lines.length) {
      this.skipBlankLines();
      if (this.lineIndex >= this.lines.length) {
        break;
      }
      const line = this.lines[this.lineIndex];
      if (line.indent !== indent || !(line.content === '-' || line.content.startsWith('- '))) {
        break;
      }
      const itemText = line.content.slice(1).trimStart();
      this.lineIndex++;
      if (!itemText) {
        values.push(this.parseNestedValue(indent));
      } else if (this.findMappingSeparator(itemText) >= 0) {
        values.push(this.parseSequenceMapping(indent, itemText));
      } else {
        values.push(this.parseValue(itemText, indent));
      }
    }
    return values;
  }

  /** Parses a mapping used as one sequence item, including continuation keys. */
  private parseSequenceMapping(indent: number, firstEntry: string): YAMLMapping {
    const result: YAMLMapping = {};
    this.parseMappingEntry(result, firstEntry, indent);
    while (this.lineIndex < this.lines.length) {
      this.skipBlankLines();
      if (this.lineIndex >= this.lines.length || this.lines[this.lineIndex].indent <= indent) {
        break;
      }
      const line = this.lines[this.lineIndex];
      if (this.findMappingSeparator(line.content) < 0) {
        break;
      }
      this.lineIndex++;
      this.parseMappingEntry(result, line.content, line.indent);
    }
    return result;
  }

  /** Parses a block mapping. */
  private parseMapping(indent: number): YAMLMapping {
    const result: YAMLMapping = {};
    while (this.lineIndex < this.lines.length) {
      this.skipBlankLines();
      if (this.lineIndex >= this.lines.length) {
        break;
      }
      const line = this.lines[this.lineIndex];
      if (line.indent !== indent || this.findMappingSeparator(line.content) < 0) {
        break;
      }
      this.lineIndex++;
      this.parseMappingEntry(result, line.content, indent);
    }
    return result;
  }

  /** Parses one `key: value` mapping entry. */
  private parseMappingEntry(result: YAMLMapping, entry: string, indent: number): void {
    const separatorIndex = this.findMappingSeparator(entry);
    if (separatorIndex < 0) {
      throw this.error('Expected a mapping entry', this.lineIndex - 1);
    }
    const keyText = entry.slice(0, separatorIndex).trim();
    const key = this.parseKey(keyText);
    if (this.options.stringKeys && typeof key !== 'string') {
      throw this.error('Mapping keys must be strings', this.lineIndex - 1);
    }
    const keyString = key === null ? 'null' : String(key);
    if (this.options.uniqueKeys && Object.prototype.hasOwnProperty.call(result, keyString)) {
      throw this.error(`Duplicate mapping key: ${keyString}`, this.lineIndex - 1);
    }
    const valueText = entry.slice(separatorIndex + 1).trimStart();
    const parsedValue = valueText
      ? this.parseValue(valueText, indent)
      : this.parseNestedValue(indent);
    if (keyText === '<<') {
      this.mergeMapping(result, parsedValue);
    } else {
      result[keyString] = parsedValue;
    }
  }

  /** Parses a nested block following a mapping or empty sequence item. */
  private parseNestedValue(parentIndent: number): unknown {
    this.skipBlankLines();
    if (this.lineIndex >= this.lines.length || this.lines[this.lineIndex].indent <= parentIndent) {
      return null;
    }
    return this.parseBlock(this.lines[this.lineIndex].indent);
  }

  /** Parses a scalar or flow collection. */
  private parseValue(value: string, parentIndent: number): unknown {
    const anchorMatch = value.match(/^&([^ ]+)(?: +(.*))?$/);
    if (anchorMatch) {
      const anchoredValue = anchorMatch[2]
        ? this.parseValue(anchorMatch[2], parentIndent)
        : this.parseNestedValue(parentIndent);
      this.anchors.set(anchorMatch[1], anchoredValue);
      return anchoredValue;
    }
    const aliasMatch = value.match(/^\*([^ ]+)$/);
    if (aliasMatch) {
      if (!this.anchors.has(aliasMatch[1])) {
        throw this.error(`Unknown YAML alias: ${aliasMatch[1]}`, this.lineIndex - 1);
      }
      return this.resolveAlias(aliasMatch[1]);
    }
    if (
      value === '|' ||
      value.startsWith('|-') ||
      value.startsWith('|+') ||
      value.startsWith('|2')
    ) {
      return this.parseBlockScalar(parentIndent, value, false);
    }
    if (
      value === '>' ||
      value.startsWith('>-') ||
      value.startsWith('>+') ||
      value.startsWith('>2')
    ) {
      return this.parseBlockScalar(parentIndent, value, true);
    }
    return new YAMLFlowParser(
      value,
      this.options,
      message => this.error(message, this.lineIndex - 1),
      name => this.resolveAlias(name)
    ).parse();
  }

  /** Parses a literal or folded block scalar. */
  private parseBlockScalar(parentIndent: number, indicator: string, folded: boolean): string {
    const blockLines: string[] = [];
    const contentIndent = this.lines
      .slice(this.lineIndex)
      .find(line => !line.blank && line.indent > parentIndent)?.indent;
    while (
      this.lineIndex < this.lines.length &&
      (this.lines[this.lineIndex].blank || this.lines[this.lineIndex].indent > parentIndent)
    ) {
      const line = this.lines[this.lineIndex++];
      blockLines.push(
        line.blank || contentIndent === undefined
          ? ''
          : ' '.repeat(Math.max(0, line.indent - contentIndent)) + line.content
      );
    }
    if (!indicator.includes('+')) {
      while (blockLines.at(-1) === '') {
        blockLines.pop();
      }
    }
    const value = folded ? blockLines.join(' ').replace(/ +/g, ' ') : blockLines.join('\n');
    return indicator.includes('-') ? value : `${value}\n`;
  }

  /** Parses a mapping key using the same scalar rules as values. */
  private parseKey(key: string): unknown {
    return new YAMLFlowParser(
      key,
      this.options,
      message => this.error(message, this.lineIndex - 1),
      name => this.resolveAlias(name)
    ).parse();
  }

  /** Resolves a previously declared anchor. */
  private resolveAlias(name: string): unknown {
    if (!this.anchors.has(name)) {
      throw this.error(`Unknown YAML alias: ${name}`, this.lineIndex - 1);
    }
    return this.anchors.get(name);
  }

  /** Merges aliased mappings into a mapping without replacing explicit keys. */
  private mergeMapping(result: YAMLMapping, value: unknown): void {
    const mappings = Array.isArray(value) ? value : [value];
    for (const mapping of mappings) {
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
        throw this.error('Merge keys require mapping aliases', this.lineIndex - 1);
      }
      for (const [key, entryValue] of Object.entries(mapping)) {
        if (!Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = entryValue;
        }
      }
    }
  }

  /** Finds a colon that separates a mapping key from its value. */
  private findMappingSeparator(value: string): number {
    let quote: string | null = null;
    let depth = 0;
    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      if (quote) {
        if (character === quote && value[index - 1] !== '\\') {
          quote = null;
        }
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '[' || character === '{') {
        depth++;
      } else if (character === ']' || character === '}') {
        depth--;
      } else if (
        character === ':' &&
        depth === 0 &&
        (!value[index + 1] || /\s/.test(value[index + 1]))
      ) {
        return index;
      }
    }
    return -1;
  }

  /** Removes comments while preserving comment characters inside quoted values. */
  private stripComment(value: string): string {
    let quote: string | null = null;
    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      if (quote) {
        if (character === quote && value[index - 1] !== '\\') {
          quote = null;
        }
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '#' && (index === 0 || /\s/.test(value[index - 1]))) {
        return value.slice(0, index).trimEnd();
      }
    }
    return value;
  }

  /** Skips blank and comment-only lines outside block scalar values. */
  private skipBlankLines(): void {
    while (this.lineIndex < this.lines.length && this.lines[this.lineIndex].blank) {
      this.lineIndex++;
    }
  }

  /** Creates a source-oriented parser error. */
  private error(message: string, lineIndex: number): Error {
    return new Error(`YAML parse error on line ${lineIndex + 1}: ${message}`);
  }
}

/** Parses flow-style YAML values such as arrays, objects, and quoted scalars. */
class YAMLFlowParser {
  private readonly text: string;
  private readonly options: YAMLParseOptions;
  private readonly errorFactory: (message: string) => Error;
  private readonly resolveAlias: (name: string) => unknown;
  private index = 0;

  /** Creates a flow-value parser. */
  constructor(
    text: string,
    options: YAMLParseOptions,
    errorFactory: (message: string) => Error,
    resolveAlias: (name: string) => unknown
  ) {
    this.text = text;
    this.options = options;
    this.errorFactory = errorFactory;
    this.resolveAlias = resolveAlias;
  }

  /** Parses one value and rejects trailing characters. */
  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index < this.text.length) {
      throw this.errorFactory('Unexpected trailing content');
    }
    return value;
  }

  /** Parses a flow collection, quoted scalar, or plain scalar. */
  private parseValue({stopAtColon = false, stopAtComma = false} = {}): unknown {
    const character = this.text[this.index];
    if (character === '[') {
      return this.parseArray();
    }
    if (character === '{') {
      return this.parseObject();
    }
    if (character === '"' || character === "'") {
      return this.parseQuotedString(character);
    }
    if (character === '*') {
      return this.parseAlias();
    }
    return this.parseScalar(this.readPlainValue(stopAtColon, stopAtComma));
  }

  /** Parses and resolves an alias inside a flow collection. */
  private parseAlias(): unknown {
    this.index++;
    const start = this.index;
    while (this.index < this.text.length && !/[\s,\]}]/.test(this.text[this.index])) {
      this.index++;
    }
    const name = this.text.slice(start, this.index);
    if (!name) {
      throw this.errorFactory('Expected an alias name');
    }
    return this.resolveAlias(name);
  }

  /** Parses a flow sequence. */
  private parseArray(): unknown[] {
    this.index++;
    const result: unknown[] = [];
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] === ']') {
        this.index++;
        return result;
      }
      result.push(this.parseValue({stopAtComma: true}));
      this.skipWhitespace();
      if (this.text[this.index] === ',') {
        this.index++;
      } else if (this.text[this.index] !== ']') {
        throw this.errorFactory('Expected comma or closing bracket');
      }
    }
  }

  /** Parses a flow mapping. */
  private parseObject(): YAMLMapping {
    this.index++;
    const result: YAMLMapping = {};
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] === '}') {
        this.index++;
        return result;
      }
      const key = this.parseValue({stopAtColon: true});
      this.skipWhitespace();
      if (this.text[this.index++] !== ':') {
        throw this.errorFactory('Expected colon in flow mapping');
      }
      this.skipWhitespace();
      const value = this.parseValue({stopAtComma: true});
      if (this.options.stringKeys && typeof key !== 'string') {
        throw this.errorFactory('Mapping keys must be strings');
      }
      const keyString = key === null ? 'null' : String(key);
      if (this.options.uniqueKeys && Object.prototype.hasOwnProperty.call(result, keyString)) {
        throw this.errorFactory(`Duplicate mapping key: ${keyString}`);
      }
      result[keyString] = value;
      this.skipWhitespace();
      if (this.text[this.index] === ',') {
        this.index++;
      } else if (this.text[this.index] !== '}') {
        throw this.errorFactory('Expected comma or closing brace');
      }
    }
  }

  /** Parses a quoted YAML string. */
  private parseQuotedString(quote: string): string {
    this.index++;
    let result = '';
    while (this.index < this.text.length) {
      const character = this.text[this.index++];
      if (character === quote) {
        if (quote === "'" && this.text[this.index] === "'") {
          result += "'";
          this.index++;
          continue;
        }
        return result;
      }
      if (quote === '"' && character === '\\') {
        const escaped = this.text[this.index++];
        const escapes: Record<string, string> = {
          n: '\n',
          r: '\r',
          t: '\t',
          '"': '"',
          '\\': '\\',
          '/': '/'
        };
        if (escaped === 'u') {
          result += String.fromCharCode(
            Number.parseInt(this.text.slice(this.index, this.index + 4), 16)
          );
          this.index += 4;
        } else {
          result += escapes[escaped] ?? escaped;
        }
      } else {
        result += character;
      }
    }
    throw this.errorFactory('Unterminated quoted string');
  }

  /** Reads a plain scalar until flow syntax. */
  private readPlainValue(stopAtColon: boolean, stopAtComma: boolean): string {
    const start = this.index;
    let depth = 0;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === '[' || character === '{') {
        depth++;
      } else if (character === ']' || character === '}') {
        if (depth === 0) {
          break;
        }
        depth--;
      } else if (
        ((stopAtComma && character === ',') || (stopAtColon && character === ':')) &&
        depth === 0
      ) {
        break;
      }
      this.index++;
    }
    return this.text.slice(start, this.index).trim();
  }

  /** Resolves a plain scalar according to the selected YAML version. */
  private parseScalar(value: string): unknown {
    if (value === '' || value === '~' || value === 'null' || value === 'Null' || value === 'NULL') {
      return null;
    }
    if (value === 'true' || value === 'True' || value === 'TRUE') {
      return true;
    }
    if (value === 'false' || value === 'False' || value === 'FALSE') {
      return false;
    }
    if (this.options.version === '1.1' && /^(?:y|yes|on)$/i.test(value)) {
      return true;
    }
    if (this.options.version === '1.1' && /^(?:n|no|off)$/i.test(value)) {
      return false;
    }
    const normalized = value.replace(/_/g, '');
    if (/^[-+]?0x[0-9a-f]+$/i.test(normalized)) {
      return Number.parseInt(normalized, 16);
    }
    if (/^[-+]?0o[0-7]+$/i.test(normalized)) {
      return Number.parseInt(normalized.replace(/^([+-]?)0o/i, '$1'), 8);
    }
    if (/^[-+]?0b[01]+$/i.test(normalized)) {
      return Number.parseInt(normalized.replace(/^([+-]?)0b/i, '$1'), 2);
    }
    if (/^[-+]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:e[-+]?[0-9]+)?$/i.test(normalized)) {
      if (this.options.intAsBigInt && /^[-+]?\d+$/.test(normalized)) {
        return BigInt(normalized);
      }
      return Number(normalized);
    }
    return value;
  }

  /** Advances over whitespace. */
  private skipWhitespace(): void {
    while (/\s/.test(this.text[this.index] ?? '')) {
      this.index++;
    }
  }
}
