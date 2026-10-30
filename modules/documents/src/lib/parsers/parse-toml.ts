// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TOMLParseOptions} from '../../toml-loader-options';

/** Parses a TOML document into its JavaScript representation. */
export function parseTOMLSync(text: string, options?: TOMLParseOptions): Record<string, unknown> {
  return new TOMLParser(text, options).parse();
}

type TOMLTable = Record<string, unknown>;

/** Dependency-free TOML parser for TOML 1.0/1.1 documents. */
class TOMLParser {
  private readonly lines: string[];
  private readonly options: TOMLParseOptions;
  private readonly root: TOMLTable = {};
  private currentTable: TOMLTable = this.root;

  /** Creates a parser for one TOML document. */
  constructor(text: string, options: TOMLParseOptions = {}) {
    this.lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    this.options = options;
  }

  /** Parses the document root. */
  parse(): TOMLTable {
    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const sourceLine = this.lines[lineIndex];
      const line = stripTOMLComment(sourceLine).trim();
      if (!line) {
        continue;
      }
      if (line.startsWith('[[') && line.endsWith(']]')) {
        this.currentTable = this.openArrayTable(line.slice(2, -2).trim(), lineIndex);
      } else if (line.startsWith('[') && line.endsWith(']')) {
        this.currentTable = this.openTable(line.slice(1, -1).trim(), lineIndex);
      } else {
        const assignmentLineIndex = lineIndex;
        let assignment = sourceLine;
        while (!isTOMLValueComplete(getTOMLValueText(assignment))) {
          if (lineIndex + 1 >= this.lines.length) {
            break;
          }
          lineIndex++;
          assignment += `\n${this.lines[lineIndex]}`;
        }
        this.parseAssignment(stripTOMLComment(assignment).trim(), assignmentLineIndex);
      }
    }
    return this.root;
  }

  /** Opens or creates a regular table. */
  private openTable(pathText: string, lineIndex: number): TOMLTable {
    const path = parseTOMLKey(pathText, lineIndex);
    return this.resolveTable(path, lineIndex);
  }

  /** Opens a new array-of-tables entry. */
  private openArrayTable(pathText: string, lineIndex: number): TOMLTable {
    const path = parseTOMLKey(pathText, lineIndex);
    const key = path.pop();
    if (!key) {
      throw tomlError(lineIndex, 'Empty table name');
    }
    const parent = this.resolveTable(path, lineIndex);
    const existingEntries = parent[key];
    if (existingEntries !== undefined && !Array.isArray(existingEntries)) {
      throw tomlError(lineIndex, `Cannot redefine ${pathText}`);
    }
    const table: TOMLTable = {};
    const entries = (existingEntries as TOMLTable[] | undefined) ?? [];
    entries.push(table);
    parent[key] = entries;
    return table;
  }

  /** Resolves a table path, selecting the most recent array-table element. */
  private resolveTable(path: string[], lineIndex: number): TOMLTable {
    let table = this.root;
    for (const key of path) {
      const value = table[key];
      if (value === undefined) {
        table[key] = {};
        table = table[key] as TOMLTable;
      } else if (Array.isArray(value)) {
        const activeTable = value[value.length - 1];
        if (!isTOMLTable(activeTable)) {
          throw tomlError(lineIndex, `Cannot create table ${path.join('.')}`);
        }
        table = activeTable;
      } else if (isTOMLTable(value)) {
        table = value;
      } else {
        throw tomlError(lineIndex, `Cannot redefine ${path.join('.')}`);
      }
    }
    return table;
  }

  /** Parses a key/value assignment. */
  private parseAssignment(line: string, lineIndex: number): void {
    const separator = findTOMLSeparator(line, '=');
    if (separator < 0) {
      throw tomlError(lineIndex, 'Expected a key/value assignment');
    }
    const path = parseTOMLKey(line.slice(0, separator).trim(), lineIndex);
    const value = new TOMLValueParser(
      line.slice(separator + 1).trim(),
      this.options,
      lineIndex
    ).parse();
    let target = this.currentTable;
    for (const key of path.slice(0, -1)) {
      const nested = target[key];
      if (nested !== undefined && !isTOMLTable(nested)) {
        throw tomlError(lineIndex, `Cannot create dotted key ${path.join('.')}`);
      }
      target[key] = nested ?? {};
      target = target[key] as TOMLTable;
    }
    const key = path[path.length - 1];
    if (!key || Object.prototype.hasOwnProperty.call(target, key)) {
      throw tomlError(lineIndex, `Duplicate key ${path.join('.')}`);
    }
    target[key] = value;
  }
}

/** Parses TOML values, including arrays and inline tables. */
class TOMLValueParser {
  private readonly text: string;
  private readonly options: TOMLParseOptions;
  private readonly lineIndex: number;
  private index = 0;

  /** Creates a value parser. */
  constructor(text: string, options: TOMLParseOptions, lineIndex: number) {
    this.text = text;
    this.options = options;
    this.lineIndex = lineIndex;
  }

  /** Parses one TOML value. */
  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.text.length) {
      throw tomlError(this.lineIndex, 'Unexpected trailing value content');
    }
    return value;
  }

  /** Parses a scalar, array, or inline table. */
  private parseValue(): unknown {
    const character = this.text[this.index];
    if (character === '"' || character === "'") {
      return this.parseString(character);
    }
    if (character === '[') {
      return this.parseArray();
    }
    if (character === '{') {
      return this.parseInlineTable();
    }
    const word = this.readWord();
    if (word === 'true' || word === 'false') {
      return word === 'true';
    }
    if (/^[+-]?(?:inf|nan)$/i.test(word)) {
      return word.toLowerCase().includes('nan')
        ? Number.NaN
        : word.startsWith('-')
          ? -Infinity
          : Infinity;
    }
    const normalized = word.replace(/_/g, '');
    if (/^[+-]?0x[0-9a-f]+$/i.test(normalized)) {
      return parseTOMLInteger(normalized, Number.parseInt(normalized, 16), this.options);
    }
    if (/^[+-]?0o[0-7]+$/i.test(normalized)) {
      return parseTOMLInteger(
        normalized,
        Number.parseInt(normalized.replace(/^([+-]?)0o/i, '$1'), 8),
        this.options
      );
    }
    if (/^[+-]?0b[01]+$/i.test(normalized)) {
      return parseTOMLInteger(
        normalized,
        Number.parseInt(normalized.replace(/^([+-]?)0b/i, '$1'), 2),
        this.options
      );
    }
    if (/^[+-]?\d+$/.test(normalized)) {
      return parseTOMLInteger(normalized, Number(normalized), this.options);
    }
    if (/^[+-]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:e[+-]?\d+)?$/i.test(normalized)) {
      return Number(normalized);
    }
    if (
      /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/.test(
        word
      )
    ) {
      return new Date(word.replace(' ', 'T'));
    }
    throw tomlError(this.lineIndex, `Invalid value: ${word}`);
  }

  /** Parses a basic or literal string. */
  private parseString(quote: string): string {
    const delimiter = this.text.startsWith(quote.repeat(3), this.index) ? quote.repeat(3) : quote;
    const multiline = delimiter.length === 3;
    this.index += delimiter.length;
    if (multiline && this.text[this.index] === '\n') {
      this.index++;
    }
    let result = '';
    while (this.index < this.text.length) {
      if (multiline && this.text.startsWith(delimiter, this.index)) {
        this.index += delimiter.length;
        return result;
      }
      const character = this.text[this.index++];
      if (!multiline && character === quote) {
        return result;
      }
      if (quote === '"' && character === '\\') {
        const escaped = this.text[this.index++];
        const escapes: Record<string, string> = {
          b: '\b',
          t: '\t',
          n: '\n',
          f: '\f',
          r: '\r',
          '"': '"',
          '\\': '\\'
        };
        if (escaped === 'u' || escaped === 'U') {
          const length = escaped === 'u' ? 4 : 8;
          result += String.fromCodePoint(
            Number.parseInt(this.text.slice(this.index, this.index + length), 16)
          );
          this.index += length;
        } else if (escapes[escaped]) {
          result += escapes[escaped];
        } else {
          throw tomlError(this.lineIndex, `Invalid escape sequence: \\${escaped}`);
        }
      } else {
        result += character;
      }
    }
    throw tomlError(this.lineIndex, 'Unterminated string');
  }

  /** Parses an array value. */
  private parseArray(): unknown[] {
    this.index++;
    const result: unknown[] = [];
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] === ']') {
        this.index++;
        return result;
      }
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.text[this.index] === ',') {
        this.index++;
      } else if (this.text[this.index] !== ']') {
        throw tomlError(this.lineIndex, 'Expected comma or closing bracket');
      }
    }
  }

  /** Parses an inline table. */
  private parseInlineTable(): TOMLTable {
    this.index++;
    const result: TOMLTable = {};
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] === '}') {
        this.index++;
        return result;
      }
      const keyStart = this.index;
      const separator = findTOMLSeparator(this.text.slice(this.index), '=');
      if (separator < 0) {
        throw tomlError(this.lineIndex, 'Expected equals sign in inline table');
      }
      const keyText = this.text.slice(keyStart, keyStart + separator).trim();
      this.index = keyStart + separator + 1;
      this.skipWhitespace();
      const keyPath = parseTOMLKey(keyText, this.lineIndex);
      let target = result;
      for (const key of keyPath.slice(0, -1)) {
        const nested = target[key];
        if (nested !== undefined && !isTOMLTable(nested)) {
          throw tomlError(this.lineIndex, `Cannot create dotted key ${keyPath.join('.')}`);
        }
        target[key] = nested ?? {};
        target = target[key] as TOMLTable;
      }
      const key = keyPath[keyPath.length - 1];
      if (!key || Object.prototype.hasOwnProperty.call(target, key)) {
        throw tomlError(this.lineIndex, `Duplicate key ${keyPath.join('.')}`);
      }
      target[key] = this.parseValue();
      this.skipWhitespace();
      if (this.text[this.index] === ',') {
        this.index++;
      } else if (this.text[this.index] !== '}') {
        throw tomlError(this.lineIndex, 'Expected comma or closing brace');
      }
    }
  }

  /** Reads an unquoted TOML scalar. */
  private readWord(): string {
    const start = this.index;
    while (this.index < this.text.length && !/[\s,\]}]/.test(this.text[this.index])) {
      this.index++;
    }
    return this.text.slice(start, this.index);
  }

  /** Skips spaces inside arrays and inline tables. */
  private skipWhitespace(): void {
    while (/\s/.test(this.text[this.index] ?? '')) {
      this.index++;
    }
  }
}

/** Parses bare and quoted dotted TOML keys. */
function parseTOMLKey(text: string, lineIndex: number): string[] {
  const keys: string[] = [];
  let index = 0;
  while (index < text.length) {
    while (/\s/.test(text[index] ?? '')) index++;
    if (text[index] === '"' || text[index] === "'") {
      const quote = text[index++];
      const start = index;
      while (index < text.length && text[index] !== quote) index++;
      if (text[index] !== quote) throw tomlError(lineIndex, 'Unterminated quoted key');
      keys.push(text.slice(start, index));
      index++;
    } else {
      const start = index;
      while (index < text.length && text[index] !== '.' && !/\s/.test(text[index])) index++;
      const key = text.slice(start, index);
      if (!key || !/^[A-Za-z0-9_-]+$/.test(key)) throw tomlError(lineIndex, `Invalid key: ${key}`);
      keys.push(key);
    }
    while (/\s/.test(text[index] ?? '')) index++;
    if (index === text.length) return keys;
    if (text[index++] !== '.') throw tomlError(lineIndex, 'Expected dot between keys');
  }
  throw tomlError(lineIndex, 'Empty key');
}

/** Finds a delimiter outside quoted strings and nested collections. */
function findTOMLSeparator(text: string, separator: string): number {
  let quote: string | null = null;
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quote) {
      if (character === quote && text[index - 1] !== '\\') quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '[' || character === '{') {
      depth++;
    } else if (character === ']' || character === '}') {
      depth--;
    } else if (character === separator && depth === 0) {
      return index;
    }
  }
  return -1;
}

/** Removes TOML comments outside quoted strings. */
function stripTOMLComment(text: string): string {
  let quote: string | null = null;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quote) {
      if (text.startsWith(quote, index) && (quote.length === 3 || text[index - 1] !== '\\')) {
        index += quote.length - 1;
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = text.startsWith(character.repeat(3), index) ? character.repeat(3) : character;
    } else if (character === '#') {
      return text.slice(0, index);
    }
  }
  return text;
}

/** Returns the value portion of a TOML assignment. */
function getTOMLValueText(text: string): string {
  const separator = findTOMLSeparator(text, '=');
  return separator < 0 ? '' : stripTOMLComment(text.slice(separator + 1)).trim();
}

/** Checks whether a TOML value is complete across physical lines. */
function isTOMLValueComplete(text: string): boolean {
  if (!text) {
    return false;
  }
  let quote: string | null = null;
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quote) {
      if (text.startsWith(quote, index) && (quote.length === 3 || text[index - 1] !== '\\')) {
        index += quote.length - 1;
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = text.startsWith(character.repeat(3), index) ? character.repeat(3) : character;
    } else if (character === '[' || character === '{') {
      depth++;
    } else if (character === ']' || character === '}') {
      depth--;
    }
  }
  return depth === 0 && !quote;
}

/** Converts a TOML integer to a number or BigInt according to parser options. */
function parseTOMLInteger(
  text: string,
  numericValue: number,
  options: TOMLParseOptions
): number | bigint {
  const mode = options.integersAsBigInt;
  const useBigInt = mode === true || (mode === 'asNeeded' && !Number.isSafeInteger(numericValue));
  return useBigInt ? BigInt(text) : numericValue;
}

/** Checks whether a value can hold TOML child keys. */
function isTOMLTable(value: unknown): value is TOMLTable {
  return (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
  );
}

/** Creates a source-oriented TOML parser error. */
function tomlError(lineIndex: number, message: string): Error {
  return new Error(`TOML parse error on line ${lineIndex + 1}: ${message}`);
}
