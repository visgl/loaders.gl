// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  USDAssetPath,
  USDAttribute,
  USDPrim,
  USDStage,
  USDValue,
  USDVariant
} from './usd-types';

type USDToken = {
  /** Decoded token value. */
  value: string;
  /** One-based source line. */
  line: number;
  /** Lexical token category. */
  kind: 'word' | 'number' | 'string' | 'asset' | 'path' | 'punctuation' | 'end';
};

type USDPrimContents = Pick<USDPrim, 'attributes' | 'metadata' | 'children' | 'variants'>;

const NUMBER_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const QUALIFIERS = new Set([
  'uniform',
  'varying',
  'custom',
  'prepend',
  'append',
  'add',
  'delete',
  'reorder'
]);

/** Parses an OpenUSD ASCII layer. */
export function parseUSDA(source: string, url?: string): USDStage {
  if (!source.trimStart().startsWith('#usda')) {
    throw new Error('OpenUSD ASCII layers must begin with the #usda header.');
  }

  return new USDAParser(source, url).parse();
}

/** Recursive-descent parser for the supported USDA syntax. */
class USDAParser {
  /** Token stream for the source layer. */
  private readonly tokenizer: USDTokenizer;
  /** URL of the source layer. */
  private readonly url: string | undefined;

  /** Creates a USDA parser. */
  constructor(source: string, url?: string) {
    this.tokenizer = new USDTokenizer(source);
    this.url = url;
  }

  /** Parses the complete USDA layer. */
  parse(): USDStage {
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};
    const rootPrims: USDPrim[] = [];

    while (!this.tokenizer.isAtEnd()) {
      if (this.isPrimDeclaration()) {
        rootPrims.push(this.parsePrim(''));
      } else {
        this.tokenizer.read();
      }
    }

    return {
      format: 'usda',
      url: this.url,
      metadata,
      rootPrims,
      layers: this.url ? [this.url] : []
    };
  }

  /** Parses a prim and its descendants. */
  private parsePrim(parentPath: string): USDPrim {
    const declaration = this.tokenizer.read();
    const specifier = declaration.value as USDPrim['specifier'];
    const firstToken = this.tokenizer.read();
    const hasExplicitType = this.tokenizer.peek().kind === 'string';
    const type = hasExplicitType ? firstToken.value : '';
    const name = hasExplicitType ? this.tokenizer.read().value : firstToken.value;
    const path = `${parentPath}/${name}`;
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};

    this.tokenizer.expect('{');
    const contents = this.parsePrimContents(path);

    return {
      name,
      path,
      sourceUrl: this.url,
      type,
      specifier,
      attributes: contents.attributes,
      metadata: {...metadata, ...contents.metadata},
      variants: contents.variants,
      children: contents.children
    };
  }

  /** Parses the attributes, variants, and child prims inside a prim body. */
  private parsePrimContents(parentPath: string): USDPrimContents {
    const attributes: Record<string, USDAttribute> = {};
    const metadata: Record<string, USDValue> = {};
    const children: USDPrim[] = [];
    const variants: Record<string, Record<string, USDVariant>> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match('}')) {
      if (this.isPrimDeclaration()) {
        children.push(this.parsePrim(parentPath));
      } else if (this.tokenizer.peek().value === 'variantSet') {
        this.parseVariantSet(parentPath, variants);
      } else {
        const attribute = this.parseAttribute();
        if (attribute) {
          attributes[attribute.name] = attribute;
        }
      }
    }

    return {attributes, metadata, children, variants};
  }

  /** Parses one named variant set. */
  private parseVariantSet(
    parentPath: string,
    variants: Record<string, Record<string, USDVariant>>
  ): void {
    this.tokenizer.expect('variantSet');
    const variantSetName = this.tokenizer.read().value;
    this.tokenizer.expect('=');
    this.tokenizer.expect('{');
    const variantSet: Record<string, USDVariant> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match('}')) {
      const variantName = this.tokenizer.read().value;
      this.tokenizer.expect('{');
      const contents = this.parsePrimContents(parentPath);
      variantSet[variantName] = {
        attributes: contents.attributes,
        metadata: contents.metadata,
        children: contents.children
      };
    }

    variants[variantSetName] = variantSet;
  }

  /** Parses an attribute declaration at the current token. */
  private parseAttribute(): USDAttribute | null {
    const firstToken = this.tokenizer.read();
    if (firstToken.kind === 'end') {
      return null;
    }

    const declarationTokens = [firstToken];
    while (!this.tokenizer.isAtEnd() && this.tokenizer.peek().line === firstToken.line) {
      const nextToken = this.tokenizer.peek();
      if (nextToken.value === '=') {
        this.tokenizer.read();
        break;
      }
      if (nextToken.value === '{' || nextToken.value === '}') {
        return null;
      }
      declarationTokens.push(this.tokenizer.read());
    }

    const hasAssignment = this.tokenizer.previousValue === '=';
    if (!hasAssignment) {
      return null;
    }

    const significantTokens = declarationTokens.filter(token => !QUALIFIERS.has(token.value));
    if (significantTokens.length === 0) {
      return null;
    }

    const name = significantTokens[significantTokens.length - 1].value;
    const type = significantTokens
      .slice(0, -1)
      .map(token => token.value)
      .join('');
    const value = this.parseValue();
    const metadata = this.tokenizer.match('(') ? this.parseMetadata(')') : {};

    return {name, type, value, metadata};
  }

  /** Parses a metadata dictionary through the requested terminator. */
  private parseMetadata(terminator: ')' | '}'): Record<string, USDValue> {
    const metadata: Record<string, USDValue> = {};

    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match(terminator)) {
      this.tokenizer.match(',');
      if (this.tokenizer.peek().value === terminator) {
        this.tokenizer.read();
        break;
      }

      const firstToken = this.tokenizer.read();
      const declarationTokens = [firstToken];
      while (!this.tokenizer.isAtEnd() && this.tokenizer.peek().line === firstToken.line) {
        if (this.tokenizer.peek().value === '=' || this.tokenizer.peek().value === ':') {
          this.tokenizer.read();
          break;
        }
        if (this.tokenizer.peek().value === terminator) {
          break;
        }
        declarationTokens.push(this.tokenizer.read());
      }

      if (this.tokenizer.previousValue !== '=' && this.tokenizer.previousValue !== ':') {
        continue;
      }

      const name = declarationTokens[declarationTokens.length - 1].value;
      metadata[name] = this.parseValue();
      this.tokenizer.match(',');
    }

    return metadata;
  }

  /** Parses one scalar, list, tuple, dictionary, asset path, or scene path value. */
  private parseValue(): USDValue {
    const token = this.tokenizer.read();

    if (token.value === '[') {
      return this.parseList(']');
    }
    if (token.value === '(') {
      return this.parseList(')');
    }
    if (token.value === '{') {
      return this.parseMetadata('}');
    }
    if (token.kind === 'asset') {
      const reference: USDAssetPath = {assetPath: token.value};
      if (this.tokenizer.peek().kind === 'path' && this.tokenizer.peek().line === token.line) {
        reference.primPath = this.tokenizer.read().value;
      }
      return reference;
    }
    if (token.kind === 'path') {
      return {path: token.value};
    }
    if (token.kind === 'number') {
      return Number(token.value);
    }
    if (token.value === 'true') {
      return true;
    }
    if (token.value === 'false') {
      return false;
    }
    if (token.value === 'None' || token.value === 'null') {
      return null;
    }

    return token.value;
  }

  /** Parses a comma-separated list or tuple. */
  private parseList(terminator: ']' | ')'): USDValue[] {
    const values: USDValue[] = [];
    while (!this.tokenizer.isAtEnd() && !this.tokenizer.match(terminator)) {
      if (this.tokenizer.match(',')) {
        continue;
      }
      values.push(this.parseValue());
      this.tokenizer.match(',');
    }
    return values;
  }

  /** Returns whether the current token starts a prim declaration. */
  private isPrimDeclaration(): boolean {
    const value = this.tokenizer.peek().value;
    return value === 'def' || value === 'over' || value === 'class';
  }
}

/** Tokenizer for the supported USDA lexical syntax. */
class USDTokenizer {
  /** Complete source text. */
  private readonly source: string;
  /** Current character offset. */
  private offset = 0;
  /** Current one-based line number. */
  private line = 1;
  /** Lookahead token, when one has been read. */
  private bufferedToken: USDToken | null = null;
  /** Value of the most recently consumed token. */
  previousValue = '';

  /** Creates a tokenizer for USDA source text. */
  constructor(source: string) {
    this.source = source;
  }

  /** Returns the next token without consuming it. */
  peek(): USDToken {
    this.bufferedToken ||= this.readToken();
    return this.bufferedToken;
  }

  /** Consumes and returns the next token. */
  read(): USDToken {
    const token = this.peek();
    this.bufferedToken = null;
    this.previousValue = token.value;
    return token;
  }

  /** Consumes a token when its value matches. */
  match(value: string): boolean {
    if (this.peek().value !== value) {
      return false;
    }
    this.read();
    return true;
  }

  /** Consumes an expected token or throws a line-numbered parse error. */
  expect(value: string): void {
    const token = this.read();
    if (token.value !== value) {
      throw new Error(`Expected "${value}" at USDA line ${token.line}, received "${token.value}".`);
    }
  }

  /** Returns whether the token stream is exhausted. */
  isAtEnd(): boolean {
    return this.peek().kind === 'end';
  }

  /** Reads the next token from the current character offset. */
  private readToken(): USDToken {
    this.skipIgnoredText();
    const line = this.line;
    const character = this.source[this.offset];

    if (character === undefined) {
      return {value: '', line, kind: 'end'};
    }
    if ('{}[](),='.includes(character)) {
      this.offset++;
      return {value: character, line, kind: 'punctuation'};
    }
    if (character === '"' || character === "'") {
      return {value: this.readQuotedString(character), line, kind: 'string'};
    }
    if (character === '@') {
      return {value: this.readDelimitedValue('@'), line, kind: 'asset'};
    }
    if (character === '<') {
      return {value: this.readDelimitedValue('>'), line, kind: 'path'};
    }

    const numericMatch = this.source.slice(this.offset).match(NUMBER_PATTERN);
    if (numericMatch) {
      this.offset += numericMatch[0].length;
      return {value: numericMatch[0], line, kind: 'number'};
    }

    const startOffset = this.offset;
    while (this.offset < this.source.length) {
      const nextCharacter = this.source[this.offset];
      if (/\s/.test(nextCharacter) || '{}[](),=@<>'.includes(nextCharacter)) {
        break;
      }
      this.offset++;
    }

    if (this.offset === startOffset) {
      this.offset++;
    }

    return {value: this.source.slice(startOffset, this.offset), line, kind: 'word'};
  }

  /** Skips whitespace, comments, and triple-quoted documentation blocks. */
  private skipIgnoredText(): void {
    while (this.offset < this.source.length) {
      const character = this.source[this.offset];
      if (character === '\n') {
        this.line++;
        this.offset++;
      } else if (/\s/.test(character)) {
        this.offset++;
      } else if (character === '#') {
        while (this.offset < this.source.length && this.source[this.offset] !== '\n') {
          this.offset++;
        }
      } else if (character === '/' && this.source[this.offset + 1] === '*') {
        this.offset += 2;
        while (this.offset < this.source.length && !this.source.startsWith('*/', this.offset)) {
          if (this.source[this.offset] === '\n') {
            this.line++;
          }
          this.offset++;
        }
        this.offset += 2;
      } else if (this.source.startsWith('"""', this.offset)) {
        this.offset += 3;
        while (this.offset < this.source.length && !this.source.startsWith('"""', this.offset)) {
          if (this.source[this.offset] === '\n') {
            this.line++;
          }
          this.offset++;
        }
        this.offset += 3;
      } else {
        break;
      }
    }
  }

  /** Reads a quoted string and decodes common escapes. */
  private readQuotedString(delimiter: string): string {
    this.offset++;
    let value = '';
    while (this.offset < this.source.length) {
      const character = this.source[this.offset++];
      if (character === delimiter) {
        break;
      }
      if (character === '\\' && this.offset < this.source.length) {
        const escapedCharacter = this.source[this.offset++];
        value += escapedCharacter === 'n' ? '\n' : escapedCharacter;
      } else {
        value += character;
      }
    }
    return value;
  }

  /** Reads an asset or scene path through its closing delimiter. */
  private readDelimitedValue(delimiter: '@' | '>'): string {
    this.offset++;
    const startOffset = this.offset;
    while (this.offset < this.source.length && this.source[this.offset] !== delimiter) {
      this.offset++;
    }
    const value = this.source.slice(startOffset, this.offset);
    this.offset++;
    return value;
  }
}
