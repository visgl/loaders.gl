// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ColumnarPredicate,
  TableQuery,
  TableSelection,
  TableReference
} from '@loaders.gl/core/loader-utils';

const MAXIMUM_SQL_LENGTH = 65536;
const MAXIMUM_SELECT_TOKENS = 4096;
const RESERVED_WORDS = new Set([
  'SELECT',
  'ARRAY',
  'REAL',
  'FLOAT32',
  'FLOAT64',
  'DOUBLE',
  'PRECISION',
  'FROM',
  'WHERE',
  'LIMIT',
  'AS',
  'TRUE',
  'FALSE',
  'NULL',
  'ALL',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'DISTINCT',
  'ORDER',
  'GROUP',
  'HAVING',
  'OFFSET',
  'JOIN',
  'UNION'
]);

/** Optional WHERE support for the independently tree-shakeable structural parser. */
export type SQLSelectParserOptions = Readonly<{
  /** Converts a WHERE expression to the portable predicate vocabulary. Omission rejects WHERE. */
  parseWhere?: (expression: string) => ColumnarPredicate;
}>;

/** Parses SELECT columns/AS aliases and ARRAY[x,y,z] expressions, optional FROM, and LIMIT; WHERE requires a supplied parser. */
export function parseSQLSelect(sql: string, options: SQLSelectParserOptions = {}): TableQuery {
  const reader = new SQLQueryReader(sql);
  reader.expectKeyword('SELECT');
  let select: TableSelection[] | undefined;
  if (!reader.takeSymbol('*')) {
    select = [];
    do {
      if (reader.takeKeyword('ARRAY')) {
        reader.expectSymbol('[');
        const array: string[] = [reader.identifier()];
        while (reader.takeSymbol(',')) array.push(reader.identifier());
        reader.expectSymbol(']');
        let type: 'float32' | 'float64' | undefined;
        if (reader.takeSymbol(':')) {
          reader.expectSymbol(':');
          const typeName = reader.identifier().toUpperCase();
          if (typeName === 'FLOAT32' || typeName === 'REAL') {
            type = 'float32';
          } else if (typeName === 'FLOAT64') {
            type = 'float64';
          } else if (typeName === 'DOUBLE') {
            reader.expectKeyword('PRECISION');
            type = 'float64';
          } else {
            throw new Error(`Unsupported ARRAY cast type: ${typeName}`);
          }
          reader.expectSymbol('[');
          const length = reader.limit();
          reader.expectSymbol(']');
          if (length !== array.length) {
            throw new Error('ARRAY cast length must match the number of components.');
          }
        }
        reader.expectKeyword('AS');
        select.push({array, ...(type ? {type} : {}), as: reader.identifier()});
      } else {
        const column = reader.identifier();
        select.push(reader.takeKeyword('AS') ? {column, as: reader.identifier()} : column);
      }
    } while (reader.takeSymbol(','));
  }
  let from: TableReference | undefined;
  if (reader.takeKeyword('FROM')) {
    const source = reader.identifier();
    from = reader.takeSymbol('.') ? {source, table: reader.identifier()} : source;
    if (!source.trim() || (typeof from === 'object' && !from.table.trim()))
      throw new Error('SQL FROM requires non-empty names.');
  }
  let where: ColumnarPredicate | undefined;
  if (reader.takeKeyword('WHERE')) {
    if (typeof options.parseWhere !== 'function')
      throw new Error(
        'parseSQLSelect requires parseWhere for WHERE; use parseSQLQuery for built-in predicate support.'
      );
    where = options.parseWhere(reader.whereExpression());
    if (!where || typeof where !== 'object' || Array.isArray(where))
      throw new Error('SQL WHERE parser must return a predicate.');
  }
  let limit: number | undefined;
  if (reader.takeKeyword('LIMIT')) limit = reader.limit();
  reader.end();
  return {
    ...(select ? {select} : {}),
    ...(from === undefined ? {} : {from}),
    ...(where ? {where} : {}),
    ...(limit === undefined ? {} : {limit})
  };
}

/** Small bounded scanner shared by structural and predicate-enabled SELECT parsing. */
export class SQLQueryReader {
  /** Original SQL, retained for exact WHERE substring extraction. */
  private readonly sql: string;
  /** Current character offset. */
  private position = 0;
  /** Number of consumed structural tokens. */
  private tokens = 0;

  /** Rejects empty or oversized statements before scanning. */
  constructor(sql: string) {
    if (typeof sql !== 'string' || !sql.trim() || sql.length > MAXIMUM_SQL_LENGTH)
      throw new Error('SQL query requires a non-empty statement of at most 65536 characters.');
    this.sql = sql;
  }

  /** Consumes one mandatory keyword. */
  expectKeyword(keyword: string): void {
    if (!this.takeKeyword(keyword)) throw new Error(`SQL query expected ${keyword}.`);
  }

  /** Consumes an unquoted keyword without folding identifier names. */
  takeKeyword(keyword: string): boolean {
    this.skipWhitespace();
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.sql.slice(this.position));
    if (match?.[0].toUpperCase() !== keyword) return false;
    this.position += match[0].length;
    this.countToken();
    return true;
  }

  /** Consumes a punctuation token. */
  takeSymbol(symbol: string): boolean {
    this.skipWhitespace();
    if (this.sql[this.position] !== symbol) return false;
    this.position++;
    this.countToken();
    return true;
  }

  /** Reads one literal identifier, including doubled double-quote escapes. */
  identifier(): string {
    this.skipWhitespace();
    this.countToken();
    if (this.sql[this.position] === '"') {
      this.position++;
      let value = '';
      while (this.position < this.sql.length) {
        const character = this.sql[this.position++];
        if (character !== '"') value += character;
        else if (this.sql[this.position] === '"') {
          value += '"';
          this.position++;
        } else {
          if (!value.length) throw new Error('SQL identifiers must not be empty.');
          return value;
        }
      }
      throw new Error('SQL query contains an unterminated quoted identifier.');
    }
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.sql.slice(this.position));
    if (!match || RESERVED_WORDS.has(match[0].toUpperCase()))
      throw new Error('SQL query expected a column, alias, source, or table identifier.');
    this.position += match[0].length;
    return match[0];
  }

  /** Finds a top-level LIMIT/terminator without interpreting quoted predicate contents. */
  whereExpression(): string {
    this.skipWhitespace();
    const start = this.position;
    let quote = '';
    let depth = 0;
    while (this.position < this.sql.length) {
      const character = this.sql[this.position];
      if (quote) {
        if (character === quote) {
          if (this.sql[this.position + 1] === quote) {
            this.position += 2;
            continue;
          }
          quote = '';
        }
      } else if (character === '"' || character === "'") quote = character;
      else if (this.sql.startsWith('--', this.position) || this.sql.startsWith('/*', this.position))
        throw new Error('SQL comments are not supported.');
      else if (character === '(') {
        if (++depth > 64) throw new Error('SQL query exceeds its predicate nesting limit.');
      } else if (character === ')') {
        if (--depth < 0) throw new Error('SQL query contains unbalanced parentheses.');
      } else if (
        depth === 0 &&
        (character === ';' ||
          (this.sql.slice(this.position, this.position + 5).toUpperCase() === 'LIMIT' &&
            !/[A-Za-z0-9_.:]/.test(this.sql[this.position - 1] || '') &&
            !/[A-Za-z0-9_.:]/.test(this.sql[this.position + 5] || '')))
      )
        break;
      this.position++;
    }
    if (quote || depth) throw new Error('SQL query contains an unterminated predicate.');
    const expression = this.sql.slice(start, this.position).trim();
    if (!expression) throw new Error('SQL WHERE requires a predicate.');
    return expression;
  }

  /** Reads a non-negative safe integer row limit. */
  limit(): number {
    this.skipWhitespace();
    const match = /^\d+/.exec(this.sql.slice(this.position));
    if (!match) throw new Error('SQL LIMIT requires a non-negative safe integer.');
    this.position += match[0].length;
    const value = Number(match[0]);
    if (!Number.isSafeInteger(value))
      throw new Error('SQL LIMIT requires a non-negative safe integer.');
    return value;
  }

  /** Requires one complete statement with at most one trailing semicolon. */
  end(): void {
    this.takeSymbol(';');
    this.skipWhitespace();
    if (this.position !== this.sql.length)
      throw new Error(`Unsupported SQL query syntax at character ${this.position}.`);
  }

  /** Skips whitespace without altering quoted identifiers. */
  private skipWhitespace(): void {
    while (this.position < this.sql.length && /\s/.test(this.sql[this.position])) this.position++;
  }

  /** Bounds large projection lists independently of predicate parsing. */
  private countToken(): void {
    if (++this.tokens > MAXIMUM_SELECT_TOKENS)
      throw new Error('SQL query exceeds its structural token limit.');
  }
}
