// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  SQLLogicalPredicate,
  SQLPredicate,
  SQLPredicateParameterValues,
  SQLPredicateParserOptions,
  SQLPredicateProperty,
  SQLPredicateValue
} from './sql-predicate-types';
import {validateSQLPredicate} from './sql-predicate-schema';

const MAXIMUM_SQL_LENGTH = 65_536;
const MAXIMUM_SQL_TOKENS = 4096;
const MAXIMUM_EXPRESSION_DEPTH = 64;

type SQLPredicateToken = Readonly<{
  kind: 'identifier' | 'number' | 'parameter' | 'string' | 'symbol';
  value: string;
}>;

/**
 * Parses a small SQL `WHERE` expression into a portable CQL2-shaped predicate AST.
 *
 * Supported syntax is limited to comparisons, `IN`, `IS [NOT] NULL`, `AND`, `OR`, `NOT`, named
 * parameters, scalar literals, and parentheses. The input is the expression after `WHERE`, not a
 * complete `SELECT` statement.
 */
export function parseSQLPredicate(
  source: string,
  options: SQLPredicateParserOptions = {}
): SQLPredicate {
  const parser = new SQLPredicateParser(
    source,
    options.parameters ?? {},
    options.preserveParameters === true
  );
  const predicate = parser.parse();
  validateSQLPredicate(predicate);
  return predicate;
}

/** Dependency-free recursive-descent parser for one SQL predicate expression. */
class SQLPredicateParser {
  /** Token stream parsed by this parser instance. */
  private readonly tokens: readonly SQLPredicateToken[];
  /** Named scalar parameters available to the expression. */
  private readonly parameters: SQLPredicateParameterValues;
  /** Whether named parameters remain references in the parsed AST. */
  private readonly preserveParameters: boolean;
  /** Current index in the token stream. */
  private position = 0;

  constructor(
    source: string,
    parameters: SQLPredicateParameterValues,
    preserveParameters: boolean
  ) {
    this.tokens = tokenizeSQLPredicate(source);
    this.parameters = parameters;
    this.preserveParameters = preserveParameters;
  }

  /** Parses the complete token stream. */
  parse(): SQLPredicate {
    const predicate = this.parseOr(0);
    this.takeSymbol(';');
    const token = this.peek();
    if (token) {
      throw new Error(`SQL predicate contains unexpected token ${JSON.stringify(token.value)}`);
    }
    return predicate;
  }

  /** Parses left-associative disjunction. */
  private parseOr(depth: number): SQLPredicate {
    let predicate = this.parseAnd(depth + 1);
    while (this.takeKeyword('OR')) {
      predicate = combineLogicalPredicate('or', predicate, this.parseAnd(depth + 1));
    }
    return predicate;
  }

  /** Parses left-associative conjunction. */
  private parseAnd(depth: number): SQLPredicate {
    let predicate = this.parseNot(depth + 1);
    while (this.takeKeyword('AND')) {
      predicate = combineLogicalPredicate('and', predicate, this.parseNot(depth + 1));
    }
    return predicate;
  }

  /** Parses boolean negation and parenthesized predicates. */
  private parseNot(depth: number): SQLPredicate {
    this.assertDepth(depth);
    if (this.takeKeyword('NOT')) {
      return {op: 'not', args: [this.parseNot(depth + 1)]};
    }
    if (this.takeSymbol('(')) {
      const predicate = this.parseOr(depth + 1);
      this.expectSymbol(')');
      return predicate;
    }
    return this.parseLeaf();
  }

  /** Parses one comparison, membership, or null predicate. */
  private parseLeaf(): SQLPredicate {
    const property = this.parseProperty();
    if (this.takeKeyword('IS')) {
      const negated = this.takeKeyword('NOT');
      this.expectKeyword('NULL');
      const predicate: SQLPredicate = {op: 'isNull', args: [property]};
      return negated ? {op: 'not', args: [predicate]} : predicate;
    }

    const negatedMembership = this.takeKeyword('NOT');
    if (negatedMembership || this.peekKeyword('IN')) {
      this.expectKeyword('IN');
      this.expectSymbol('(');
      if (this.peek()?.kind === 'symbol' && this.peek()?.value === ')') {
        throw new Error('SQL predicate IN requires at least one scalar value');
      }
      const values: SQLPredicateValue[] = [this.parseValue()];
      while (this.takeSymbol(',')) {
        values.push(this.parseValue());
      }
      this.expectSymbol(')');
      const predicate: SQLPredicate = {op: 'in', args: [property, values]};
      return negatedMembership ? {op: 'not', args: [predicate]} : predicate;
    }

    const token = this.take();
    if (
      token?.kind !== 'symbol' ||
      !['=', '!=', '<>', '<', '<=', '>', '>='].includes(token.value)
    ) {
      throw new Error('SQL predicate expected a comparison, IN, or IS NULL operator');
    }
    const operator = token.value === '!=' ? '<>' : token.value;
    return {
      op: operator as '=' | '<>' | '<' | '<=' | '>' | '>=',
      args: [property, this.parseValue()]
    };
  }

  /** Parses an identifier into a property reference. */
  private parseProperty(): SQLPredicateProperty {
    const token = this.take();
    if (token?.kind !== 'identifier') {
      throw new Error('SQL predicate expected a column identifier');
    }
    return {property: token.value};
  }

  /** Parses one scalar literal or named parameter. */
  private parseValue(): SQLPredicateValue {
    const negative = this.takeSymbol('-');
    const token = this.take();
    if (!token) {
      throw new Error('SQL predicate expected a scalar value');
    }
    if (negative && token.kind !== 'number') {
      throw new Error('SQL predicate only permits unary minus on numeric literals');
    }
    if (token.kind === 'number') {
      return parseNumericLiteral(negative ? `-${token.value}` : token.value);
    }
    if (negative) {
      throw new Error('SQL predicate expected a numeric literal after unary minus');
    }
    if (token.kind === 'string') {
      return token.value;
    }
    if (token.kind === 'parameter') {
      if (this.preserveParameters) {
        return {parameter: token.value};
      }
      if (!Object.hasOwn(this.parameters, token.value)) {
        throw new Error(`SQL predicate parameter ":${token.value}" requires a value`);
      }
      const value = this.parameters[token.value];
      validateParameterValue(value, token.value);
      return value;
    }
    if (token.kind === 'identifier' && /^(TRUE|FALSE)$/i.test(token.value)) {
      return /^TRUE$/i.test(token.value);
    }
    if (token.kind === 'identifier' && /^NULL$/i.test(token.value)) {
      throw new Error('SQL predicate comparisons with NULL must use IS NULL or IS NOT NULL');
    }
    throw new Error(`SQL predicate does not support scalar token ${JSON.stringify(token.value)}`);
  }

  /** Rejects excessively nested inputs before recursion can exhaust the stack. */
  private assertDepth(depth: number): void {
    if (depth > MAXIMUM_EXPRESSION_DEPTH) {
      throw new Error('SQL predicate nesting exceeds its safe limit');
    }
  }

  /** Consumes one required keyword. */
  private expectKeyword(keyword: string): void {
    if (!this.takeKeyword(keyword)) {
      throw new Error(`SQL predicate expected ${keyword}`);
    }
  }

  /** Returns whether the next token is a keyword without consuming it. */
  private peekKeyword(keyword: string): boolean {
    const token = this.peek();
    return token?.kind === 'identifier' && token.value.toUpperCase() === keyword;
  }

  /** Consumes one optional keyword. */
  private takeKeyword(keyword: string): boolean {
    if (!this.peekKeyword(keyword)) {
      return false;
    }
    this.position++;
    return true;
  }

  /** Consumes one required symbol. */
  private expectSymbol(symbol: string): void {
    if (!this.takeSymbol(symbol)) {
      throw new Error(`SQL predicate expected ${JSON.stringify(symbol)}`);
    }
  }

  /** Consumes one optional symbol. */
  private takeSymbol(symbol: string): boolean {
    const token = this.peek();
    if (token?.kind !== 'symbol' || token.value !== symbol) {
      return false;
    }
    this.position++;
    return true;
  }

  /** Consumes and returns the next token. */
  private take(): SQLPredicateToken | undefined {
    const token = this.tokens[this.position];
    if (token) {
      this.position++;
    }
    return token;
  }

  /** Returns the next token without consuming it. */
  private peek(): SQLPredicateToken | undefined {
    return this.tokens[this.position];
  }
}

/** Flattens adjacent equal logical operators into one CQL2-shaped node. */
function combineLogicalPredicate(
  operator: 'and' | 'or',
  left: SQLPredicate,
  right: SQLPredicate
): SQLLogicalPredicate {
  return left.op === operator
    ? {op: operator, args: [...(left as SQLLogicalPredicate).args, right]}
    : {op: operator, args: [left, right]};
}

/** Converts a bounded SQL numeric token to a number or exact bigint. */
function parseNumericLiteral(source: string): number | bigint {
  if (/^-?\d+$/.test(source)) {
    const bigint = BigInt(source);
    if (bigint > BigInt(Number.MAX_SAFE_INTEGER) || bigint < BigInt(Number.MIN_SAFE_INTEGER)) {
      return bigint;
    }
  }
  const number = Number(source);
  if (!Number.isFinite(number)) {
    throw new Error('SQL predicate numeric literals must be finite');
  }
  return number;
}

/** Validates one named parameter at its parser boundary. */
function validateParameterValue(value: unknown, name: string): asserts value is SQLPredicateValue {
  const probe = {op: '=', args: [{property: '_'}, value]} as unknown;
  try {
    validateSQLPredicate(probe);
  } catch {
    throw new Error(`SQL predicate parameter ":${name}" has an unsupported value`);
  }
}

/** Tokenizes a safely bounded SQL predicate expression. */
function tokenizeSQLPredicate(source: string): SQLPredicateToken[] {
  if (
    typeof source !== 'string' ||
    source.trim().length === 0 ||
    source.length > MAXIMUM_SQL_LENGTH
  ) {
    throw new Error('SQL predicate requires a non-empty, safely bounded expression');
  }

  const tokens: SQLPredicateToken[] = [];
  let position = 0;
  while (position < source.length) {
    const character = source[position];
    if (/\s/.test(character)) {
      position++;
      continue;
    }
    if (character === "'") {
      const result = readQuotedToken(source, position, "'", "'");
      tokens.push({kind: 'string', value: result.value});
      position = result.position;
    } else if (character === '"') {
      const result = readQuotedToken(source, position, '"', '"');
      tokens.push({kind: 'identifier', value: result.value});
      position = result.position;
    } else if (character === ':') {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(position + 1));
      if (!match) {
        throw new Error(`SQL predicate contains an invalid parameter at character ${position}`);
      }
      tokens.push({kind: 'parameter', value: match[0]});
      position += match[0].length + 1;
    } else {
      const numberMatch = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(position));
      const identifierMatch = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(
        source.slice(position)
      );
      if (numberMatch) {
        tokens.push({kind: 'number', value: numberMatch[0]});
        position += numberMatch[0].length;
      } else if (identifierMatch) {
        tokens.push({kind: 'identifier', value: identifierMatch[0]});
        position += identifierMatch[0].length;
      } else {
        const twoCharacters = source.slice(position, position + 2);
        if (['<=', '>=', '<>', '!='].includes(twoCharacters)) {
          tokens.push({kind: 'symbol', value: twoCharacters});
          position += 2;
        } else if ('(),;-=<>'.includes(character)) {
          tokens.push({kind: 'symbol', value: character});
          position++;
        } else {
          throw new Error(`SQL predicate contains an unsupported token at character ${position}`);
        }
      }
    }
    if (tokens.length > MAXIMUM_SQL_TOKENS) {
      throw new Error('SQL predicate exceeds its safe token limit');
    }
  }
  return tokens;
}

/** Reads one SQL string or quoted identifier with doubled-quote escaping. */
function readQuotedToken(
  source: string,
  start: number,
  quote: string,
  escapedQuote: string
): {value: string; position: number} {
  let value = '';
  let position = start + 1;
  while (position < source.length) {
    if (source[position] !== quote) {
      value += source[position++];
      continue;
    }
    if (source[position + 1] === escapedQuote) {
      value += quote;
      position += 2;
      continue;
    }
    return {value, position: position + 1};
  }
  throw new Error(`SQL predicate contains an unterminated quoted value at character ${start}`);
}
