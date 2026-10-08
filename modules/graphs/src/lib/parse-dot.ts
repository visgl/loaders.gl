// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DOTGraphData, DOTOutput} from '../dot-types';
import type {GraphShape, GraphNode, GraphEdge} from '../graph-types';
import {buildGraphTables} from './build-graph-tables';

/** Internal DOT parsing representation. */
type DOTAttributeMap = Record<string, unknown>;

/** Internal DOT parsing representation. */
type ParsedNode = {
  /** Id in the DOT parse state. */
  id: string;
  /** Attributes in the DOT parse state. */
  attributes: DOTAttributeMap;
  /** Subgraphs in the DOT parse state. */
  subgraphs: Set<string>;
};

/** Internal DOT parsing representation. */
type ParsedEdge = {
  /** Id in the DOT parse state. */
  id: string;
  /** SourceId in the DOT parse state. */
  sourceId: string;
  /** TargetId in the DOT parse state. */
  targetId: string;
  /** Directed in the DOT parse state. */
  directed: boolean;
  /** Attributes in the DOT parse state. */
  attributes: DOTAttributeMap;
  /** Subgraphs in the DOT parse state. */
  subgraphs: string[];
};

/** Internal DOT parsing representation. */
type ParsedSubgraph = {
  /** Id in the DOT parse state. */
  id: string;
  /** Attributes in the DOT parse state. */
  attributes: DOTAttributeMap;
  /** ParentId in the DOT parse state. */
  parentId?: string | null;
};

/** Internal DOT parsing representation. */
type DOTParseResult = {
  /** Id in the DOT parse state. */
  id?: string;
  /** Directed in the DOT parse state. */
  directed: boolean;
  /** Strict in the DOT parse state. */
  strict: boolean;
  /** GraphAttributes in the DOT parse state. */
  graphAttributes: DOTAttributeMap;
  /** Nodes in the DOT parse state. */
  nodes: Map<string, ParsedNode>;
  /** Edges in the DOT parse state. */
  edges: ParsedEdge[];
  /** Subgraphs in the DOT parse state. */
  subgraphs: Map<string, ParsedSubgraph>;
};

/** Parses DOT source into plain graph records without a visualization dependency. */
export function parseDOT(input: string): DOTGraphData;
export function parseDOT(input: string, shape: GraphShape): DOTOutput;
export function parseDOT(input: string, shape: GraphShape = 'plain-graph-data'): DOTOutput {
  const parsed = parseDOTDocument(input);
  return {
    ...buildGraphTables(iterateNodes(parsed), iterateEdges(parsed), shape),
    metadata: {
      id: parsed.id,
      directed: parsed.directed,
      strict: parsed.strict,
      attributes: {...parsed.graphAttributes},
      subgraphs: Array.from(parsed.subgraphs.values(), subgraph => ({
        ...subgraph,
        attributes: {...subgraph.attributes}
      }))
    }
  };
}

/** Emits finalized nodes without creating an intermediate record array. */
function* iterateNodes(parsed: DOTParseResult): Iterable<GraphNode> {
  for (const node of parsed.nodes.values()) {
    yield {
      id: node.id,
      ...(typeof node.attributes.label === 'string' ? {label: node.attributes.label} : {}),
      attributes: {
        ...node.attributes,
        ...(node.subgraphs.size
          ? {subgraphs: Array.from(node.subgraphs, id => describeSubgraph(id, parsed.subgraphs))}
          : {})
      }
    };
  }
}

/** Emits coalesced edges in document order. */
function* iterateEdges(parsed: DOTParseResult): Iterable<GraphEdge> {
  for (const edge of parsed.edges) {
    yield {
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      directed: edge.directed,
      ...(typeof edge.attributes.label === 'string' ? {label: edge.attributes.label} : {}),
      attributes: {
        ...edge.attributes,
        ...(edge.subgraphs.length
          ? {subgraphs: edge.subgraphs.map(id => describeSubgraph(id, parsed.subgraphs))}
          : {})
      }
    };
  }
}

/** Copies a subgraph descriptor into node or edge attributes. */
function describeSubgraph(
  id: string,
  descriptors: Map<string, ParsedSubgraph>
): {id: string; attributes: DOTAttributeMap; parentId?: string | null} {
  const subgraph = descriptors.get(id)!;
  return {
    id,
    attributes: {...subgraph.attributes},
    parentId: subgraph.parentId
  };
}

/** Internal DOT parsing representation. */
type TokenType =
  | 'identifier'
  | 'string'
  | 'html'
  | 'arrow'
  | 'lbrace'
  | 'rbrace'
  | 'lbrack'
  | 'rbrack'
  | 'equals'
  | 'comma'
  | 'semicolon';

/** Internal DOT parsing representation. */
type Token = {
  /** Type in the DOT parse state. */
  type: TokenType;
  /** Value in the DOT parse state. */
  value: string;
};

/** Internal DOT parsing representation. */
type ScopeContext = {
  /** Id in the DOT parse state. */
  id?: string;
  /** NodeDefaults in the DOT parse state. */
  nodeDefaults: DOTAttributeMap;
  /** EdgeDefaults in the DOT parse state. */
  edgeDefaults: DOTAttributeMap;
  /** GraphAttributes in the DOT parse state. */
  graphAttributes: DOTAttributeMap;
};

/** Recursive parser for the supported DOT statement subset. */
class DOTParser {
  /** Tokens for DOT parsing. */
  private readonly tokens: Token[];
  /** Position for DOT parsing. */
  private position = 0;
  /** Accumulated graph records and attributes. */
  private readonly result: DOTParseResult = {
    directed: false,
    strict: false,
    graphAttributes: Object.create(null),
    nodes: new Map(),
    edges: [],
    subgraphs: new Map()
  };

  /** Scopes for DOT parsing. */
  private readonly scopes: ScopeContext[] = [
    {
      nodeDefaults: Object.create(null),
      edgeDefaults: Object.create(null),
      graphAttributes: Object.create(null)
    }
  ];

  /** Subgraph counter for DOT parsing. */
  private subgraphCounter = 0;
  /** Edge counter for DOT parsing. */
  private edgeCounter = 0;

  /** Edge lookup used to coalesce parallel edges in strict graphs. */
  private readonly strictEdges = new Map<string, ParsedEdge>();

  /** Persistent attributes and defaults for reopened named subgraphs. */
  private readonly subgraphScopes = new Map<string, ScopeContext>();

  /** Explicit names reserved so anonymous subgraph IDs cannot collide with them. */
  private readonly namedSubgraphIds = new Set<string>();

  /** Initializes the token stream. */
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    for (let index = 0; index < tokens.length - 1; index++) {
      if (isKeyword(tokens[index], 'subgraph') && isIdentifierLike(tokens[index + 1])) {
        this.namedSubgraphIds.add(tokens[index + 1].value);
      }
    }
  }

  /** Parses one complete DOT document. */
  parse(): DOTParseResult {
    this.parseGraph();
    this.consumeOptionalSemicolon();
    if (this.peek()) {
      throw new Error('Unexpected content after DOT graph.');
    }
    return this.result;
  }

  /** Reads graph identity, declaration, and statements. */
  private parseGraph(): void {
    const strictToken = this.peek();
    if (strictToken && isKeyword(strictToken, 'strict')) {
      this.consume();
      this.result.strict = true;
    }

    const typeToken = this.peek();
    if (!typeToken || !isGraphType(typeToken)) {
      throw new Error('DOT graph must start with graph or digraph keyword.');
    }
    this.consume();
    this.result.directed = isKeyword(typeToken, 'digraph');

    const idToken = this.peek();
    if (idToken && isIdentifierLike(idToken)) {
      this.result.id = parseIdentifierValue(this.consume());
    }

    this.expect('lbrace');
    while (!this.match('rbrace')) {
      if (!this.parseStatement()) {
        throw new Error('Expected closing brace in DOT graph.');
      }
    }
    this.result.graphAttributes = {...this.scopes[0].graphAttributes};
  }

  /** Dispatches a graph statement. */
  private parseStatement(): boolean {
    if (this.consumeSemicolonIfPresent()) {
      return true;
    }

    const token = this.peek();
    if (!token) {
      return false;
    }

    if (this.tryParseSubgraphStatement(token)) {
      return true;
    }

    if (this.tryParseKeywordStatement(token)) {
      return true;
    }

    if (this.tryParseAssignmentStatement(token)) {
      return true;
    }

    if (isIdentifierLike(token)) {
      this.parseNodeOrEdgeStatement();
      this.consumeOptionalSemicolon();
      return true;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  /** Consumes an empty statement. */
  private consumeSemicolonIfPresent(): boolean {
    const next = this.peek();
    if (next?.type === 'semicolon') {
      this.consume();
      return true;
    }
    return false;
  }

  /** Reads a standalone subgraph statement. */
  private tryParseSubgraphStatement(token: Token): boolean {
    if (token.type !== 'lbrace' && !isKeyword(token, 'subgraph')) {
      return false;
    }
    this.parseSubgraph();
    return true;
  }

  /** Applies graph, node, or edge defaults. */
  private tryParseKeywordStatement(token: Token): boolean {
    if (!(isKeyword(token, 'graph') || isKeyword(token, 'node') || isKeyword(token, 'edge'))) {
      return false;
    }

    this.consume();
    const explicitAttributes = this.parseAttributeList();

    if (isKeyword(token, 'graph')) {
      Object.assign(this.currentScope().graphAttributes, explicitAttributes);
    } else if (isKeyword(token, 'node')) {
      Object.assign(this.currentScope().nodeDefaults, explicitAttributes);
    } else {
      Object.assign(this.currentScope().edgeDefaults, explicitAttributes);
    }

    this.consumeOptionalSemicolon();
    return true;
  }

  /** Reads a graph attribute assignment. */
  private tryParseAssignmentStatement(token: Token): boolean {
    if (!isIdentifierLike(token)) {
      return false;
    }
    const next = this.peek(1);
    if (next?.type !== 'equals') {
      return false;
    }

    const key = parseIdentifierValue(this.consume());
    this.consume();
    const valueToken = this.consume();
    const value = parseAttributeValue(valueToken);
    this.currentScope().graphAttributes[key] = value;
    this.consumeOptionalSemicolon();
    return true;
  }

  /** Reads a node statement or chained edges. */
  private parseNodeOrEdgeStatement(): void {
    const first = parseIdentifierValue(this.consume());
    const references: string[] = [first];
    const operators: string[] = [];

    let operatorToken = this.match('arrow');
    while (operatorToken) {
      operators.push(operatorToken.value);
      const referenceToken = this.consume();
      if (!isIdentifierLike(referenceToken)) {
        throw new Error('Expected node identifier in edge statement.');
      }
      references.push(parseIdentifierValue(referenceToken));
      operatorToken = this.match('arrow');
    }

    if (operators.length === 0) {
      const explicitAttributes = this.parseAttributeList();
      this.addNode(first, explicitAttributes);
      return;
    }

    const explicitAttributes = this.parseAttributeList();
    this.addEdgeChain(references, operators, explicitAttributes);
  }

  /** Merges explicit attributes into a node. */
  private addNode(id: string, explicitAttributes: DOTAttributeMap): void {
    const membership = this.getCurrentSubgraphChain();
    const node = this.ensureNode(id, membership);
    node.attributes = {...node.attributes, ...explicitAttributes};
  }

  /** Expands an edge chain into node and edge records. */
  private addEdgeChain(
    nodes: string[],
    operators: string[],
    explicitAttributes: DOTAttributeMap
  ): void {
    const membership = this.getCurrentSubgraphChain();
    const defaults = this.currentScope().edgeDefaults;
    const attributes = {...defaults, ...explicitAttributes};

    for (let index = 0; index < nodes.length - 1; index++) {
      const sourceId = nodes[index];
      const targetId = nodes[index + 1];
      const operator = operators[index];
      const directed = operator === '->';
      if (directed !== this.result.directed) {
        throw new Error('DOT edge operator must match graph or digraph declaration.');
      }

      const edgeId = deriveEdgeId(attributes, sourceId, targetId, ++this.edgeCounter);
      const edgeAttributes = {...attributes};
      this.ensureNode(sourceId, membership);
      this.ensureNode(targetId, membership);

      const strictKey = JSON.stringify(
        directed ? [sourceId, targetId] : [sourceId, targetId].sort()
      );
      const existingEdge = this.result.strict ? this.strictEdges.get(strictKey) : undefined;
      if (existingEdge) {
        existingEdge.attributes = {...existingEdge.attributes, ...explicitAttributes};
        const explicitId = explicitAttributes.id ?? explicitAttributes.Id ?? explicitAttributes.ID;
        if (typeof explicitId === 'string' || typeof explicitId === 'number') {
          existingEdge.id = String(explicitId);
        }
        existingEdge.directed = deriveDirectedFlag(existingEdge.attributes, directed);
        existingEdge.subgraphs = Array.from(new Set([...existingEdge.subgraphs, ...membership]));
        continue;
      }
      const directedOverride = deriveDirectedFlag(edgeAttributes, directed);
      const edge: ParsedEdge = {
        id: edgeId,
        sourceId,
        targetId,
        directed: directedOverride,
        attributes: edgeAttributes,
        subgraphs: membership
      };
      this.result.edges.push(edge);
      if (this.result.strict) {
        this.strictEdges.set(strictKey, edge);
      }
    }
  }

  /** Reads a nested scope with inherited defaults. */
  private parseSubgraph(): void {
    let idToken = this.peek();
    let subgraphId: string;

    if (idToken && isKeyword(idToken, 'subgraph')) {
      this.consume();
      idToken = this.peek();
    }

    if (idToken && isIdentifierLike(idToken)) {
      subgraphId = parseIdentifierValue(this.consume());
    } else {
      do {
        subgraphId = `subgraph_${++this.subgraphCounter}`;
      } while (this.namedSubgraphIds.has(subgraphId));
    }

    this.expect('lbrace');
    const parentId = this.findCurrentSubgraphId();
    let context = this.subgraphScopes.get(subgraphId);
    if (!context) {
      context = {
        id: subgraphId,
        nodeDefaults: Object.assign(Object.create(null), this.currentScope().nodeDefaults),
        edgeDefaults: Object.assign(Object.create(null), this.currentScope().edgeDefaults),
        graphAttributes: Object.create(null)
      };
      this.subgraphScopes.set(subgraphId, context);
      this.result.subgraphs.set(subgraphId, {
        id: subgraphId,
        attributes: context.graphAttributes,
        parentId
      });
    }
    this.scopes.push(context);

    let shouldContinue = true;
    while (shouldContinue) {
      if (this.match('rbrace')) {
        break;
      }
      shouldContinue = this.parseStatement();
      if (!shouldContinue) {
        throw new Error('Expected closing brace in DOT subgraph.');
      }
    }

    this.scopes.pop();
  }

  /** Reads repeated attribute lists. */
  private parseAttributeList(): DOTAttributeMap {
    const attributes: DOTAttributeMap = Object.create(null);
    while (this.match('lbrack')) {
      while (!this.match('rbrack')) {
        const keyToken = this.consume();
        if (!isIdentifierLike(keyToken)) {
          throw new Error('Expected attribute name.');
        }
        const key = parseIdentifierValue(keyToken);
        let value: unknown = true;
        if (this.match('equals')) {
          const valueToken = this.consume();
          value = parseAttributeValue(valueToken);
        }
        attributes[key] = value;
        if (this.peek()?.type === 'comma' || this.peek()?.type === 'semicolon') {
          this.consume();
        }
      }
    }
    return attributes;
  }

  /** Creates an implicit node and records its subgraph memberships. */
  private ensureNode(id: string, membership: string[]): ParsedNode {
    let node = this.result.nodes.get(id);
    if (!node) {
      const defaults = this.currentScope().nodeDefaults;
      node = {id, attributes: {...defaults}, subgraphs: new Set()};
      this.result.nodes.set(id, node);
    }
    membership.forEach(subgraphId => node.subgraphs.add(subgraphId));
    return node;
  }

  /** Lists enclosing subgraphs. */
  private getCurrentSubgraphChain(): string[] {
    const chain: string[] = [];
    for (const scope of this.scopes) {
      if (scope.id) {
        chain.push(scope.id);
      }
    }
    return chain;
  }

  /** Finds the nearest enclosing named or generated subgraph. */
  private findCurrentSubgraphId(): string | undefined {
    for (let index = this.scopes.length - 1; index >= 0; index--) {
      const scope = this.scopes[index];
      if (scope.id) {
        return scope.id;
      }
    }
    return undefined;
  }

  /** Returns the active attribute scope. */
  private currentScope(): ScopeContext {
    return this.scopes[this.scopes.length - 1];
  }

  /** Consumes an optional statement terminator. */
  private consumeOptionalSemicolon(): void {
    const next = this.peek();
    if (next?.type === 'semicolon') {
      this.consume();
    }
  }

  /** Requires the next token to have the requested type. */
  private expect(type: TokenType): Token {
    const token = this.consume();
    if (!token || token.type !== type) {
      throw new Error(`Expected token ${type}.`);
    }
    return token;
  }

  /** Consumes the next token or reports truncated input. */
  private consume(): Token {
    const token = this.tokens[this.position];
    if (!token) {
      throw new Error('Unexpected end of DOT input.');
    }
    this.position++;
    return token;
  }

  /** Consumes a token when its type matches. */
  private match(type: TokenType): Token | null {
    const token = this.peek();
    if (token && token.type === type) {
      this.position++;
      return token;
    }
    return null;
  }

  /** Inspects a token without consuming it. */
  private peek(offset = 0): Token | null {
    return this.tokens[this.position + offset] ?? null;
  }
}

/** Tokenizes and parses a DOT document. */
function parseDOTDocument(input: string): DOTParseResult {
  const parser = new DOTParser(tokenize(input));
  return parser.parse();
}

const IDENTIFIER_TERMINATORS = new Set(['{', '}', '[', ']', '=', ';', ',', '"', '<', '#']);

/** Builds a token stream from DOT text. */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const {token, nextIndex} = readNextToken(input, index);
    if (nextIndex <= index) {
      throw new Error(`Tokenizer did not advance at position ${index}.`);
    }
    if (token) {
      tokens.push(token);
    }
    index = nextIndex;
  }

  return tokens;
}

/** Reads a token or skips whitespace and comments. */
function readNextToken(input: string, index: number): {token: Token | null; nextIndex: number} {
  if (index >= input.length) {
    return {token: null, nextIndex: input.length};
  }

  const character = input[index];

  if (isWhitespace(character)) {
    return {token: null, nextIndex: index + 1};
  }

  const commentEnd = skipComment(input, index);
  if (commentEnd !== null) {
    return {token: null, nextIndex: commentEnd};
  }

  const arrowToken = readArrowToken(input, index);
  if (arrowToken) {
    return arrowToken;
  }

  const punctuation = readPunctuationToken(character);
  if (punctuation) {
    return {token: punctuation, nextIndex: index + 1};
  }

  if (character === '"') {
    const {value, nextIndex} = readQuotedString(input, index + 1);
    return {token: {type: 'string', value}, nextIndex};
  }

  if (character === '<') {
    const {value, nextIndex} = readHtmlString(input, index + 1);
    return {token: {type: 'html', value}, nextIndex};
  }

  const identifier = readIdentifier(input, index);
  if (identifier.value) {
    return {
      token: {type: 'identifier', value: identifier.value},
      nextIndex: identifier.nextIndex
    };
  }

  throw new Error(`Unexpected token at position ${index}.`);
}

/** Skips line, block, or hash comments. */
function skipComment(input: string, index: number): number | null {
  const character = input[index];
  if (character === '/') {
    const next = input[index + 1];
    if (next === '/') {
      return skipLineComment(input, index + 2);
    }
    if (next === '*') {
      return skipBlockComment(input, index + 2);
    }
    return null;
  }

  if (character === '#') {
    return skipLineComment(input, index + 1);
  }

  return null;
}

/** Scans to the next line break. */
function skipLineComment(input: string, startIndex: number): number {
  let cursor = startIndex;
  while (cursor < input.length && !isLineBreak(input[cursor])) {
    cursor++;
  }
  return cursor;
}

/** Scans to a block comment terminator. */
function skipBlockComment(input: string, startIndex: number): number {
  let cursor = startIndex;
  while (cursor < input.length) {
    if (input[cursor] === '*' && input[cursor + 1] === '/') {
      return cursor + 2;
    }
    cursor++;
  }
  throw new Error('Unterminated block comment in DOT source.');
}

/** Recognizes directed and undirected edge operators. */
function readArrowToken(input: string, index: number): {token: Token; nextIndex: number} | null {
  const next = input[index + 1];
  if (input[index] === '-' && next === '-') {
    return {token: {type: 'arrow', value: '--'}, nextIndex: index + 2};
  }
  if (input[index] === '-' && next === '>') {
    return {token: {type: 'arrow', value: '->'}, nextIndex: index + 2};
  }
  return null;
}

/** Recognizes DOT structural punctuation. */
function readPunctuationToken(character: string): Token | null {
  switch (character) {
    case '{':
      return {type: 'lbrace', value: character};
    case '}':
      return {type: 'rbrace', value: character};
    case '[':
      return {type: 'lbrack', value: character};
    case ']':
      return {type: 'rbrack', value: character};
    case '=':
      return {type: 'equals', value: character};
    case ',':
      return {type: 'comma', value: character};
    case ';':
      return {type: 'semicolon', value: character};
    default:
      return null;
  }
}

/** Reads a quoted string and decodes its escapes. */
function readQuotedString(input: string, startIndex: number): {value: string; nextIndex: number} {
  let value = '';
  let index = startIndex;
  while (index < input.length) {
    const character = input[index];
    if (character === '"') {
      return {value, nextIndex: index + 1};
    }
    if (character === '\\') {
      const escape = readEscapedCharacter(input, index + 1);
      value += escape.value;
      index = escape.nextIndex;
    } else {
      value += character;
      index++;
    }
  }
  throw new Error('Unterminated string literal in DOT source.');
}

/** Decodes one quoted-string escape or removes a physical line continuation. */
function readEscapedCharacter(
  input: string,
  startIndex: number
): {value: string; nextIndex: number} {
  const next = input[startIndex];
  switch (next) {
    case '\n':
      return {value: '', nextIndex: startIndex + 1};
    case '\r':
      return {value: '', nextIndex: startIndex + (input[startIndex + 1] === '\n' ? 2 : 1)};
    case 'n':
    case 'l':
    case 'L':
      return {value: '\n', nextIndex: startIndex + 1};
    case 't':
      return {value: '\t', nextIndex: startIndex + 1};
    case 'r':
      return {value: '\r', nextIndex: startIndex + 1};
    case '"':
      return {value: '"', nextIndex: startIndex + 1};
    case '\\':
      return {value: '\\', nextIndex: startIndex + 1};
    default: {
      if (typeof next === 'undefined') {
        throw new Error('Unterminated escape sequence in DOT source.');
      }
      return {value: `\\${next}`, nextIndex: startIndex + 1};
    }
  }
}

/** Reads a balanced HTML-like label. */
function readHtmlString(input: string, startIndex: number): {value: string; nextIndex: number} {
  let value = '<';
  let depth = 1;
  let index = startIndex;
  while (index < input.length) {
    const character = input[index];
    value += character;
    if (character === '<') {
      depth++;
    } else if (character === '>') {
      depth--;
      if (depth === 0) {
        return {value, nextIndex: index + 1};
      }
    }
    index++;
  }
  throw new Error('Unterminated HTML-like string literal in DOT source.');
}

/** Reads an unquoted identifier. */
function readIdentifier(input: string, startIndex: number): {value: string; nextIndex: number} {
  let index = startIndex;
  let value = '';
  while (index < input.length && !isIdentifierTerminator(input, index)) {
    value += input[index];
    index++;
  }
  if (value.includes(':')) {
    throw new Error('DOT node ports are not supported; quote identifiers containing colons.');
  }
  /** Return {value, nextIndex in the DOT parse state. */
  return {value, nextIndex: index};
}

/** Tests whether a character terminates an identifier. */
function isIdentifierTerminator(input: string, index: number): boolean {
  const character = input[index];
  if (isWhitespace(character) || IDENTIFIER_TERMINATORS.has(character)) {
    return true;
  }
  if (isArrowOperatorStart(input, index)) {
    return true;
  }
  if (isCommentStart(input, index)) {
    return true;
  }
  return false;
}

/** Tests whether an edge operator starts at this position. */
function isArrowOperatorStart(input: string, index: number): boolean {
  if (input[index] !== '-') {
    return false;
  }
  const next = input[index + 1];
  return next === '-' || next === '>';
}

/** Tests whether a slash comment starts at this position. */
function isCommentStart(input: string, index: number): boolean {
  if (input[index] !== '/') {
    return false;
  }
  const next = input[index + 1];
  return next === '/' || next === '*';
}

/** Recognizes supported whitespace characters. */
function isWhitespace(character: string): boolean {
  return (
    character === ' ' ||
    character === '\n' ||
    character === '\r' ||
    character === '\t' ||
    character === '\f'
  );
}

/** Recognizes a line break. */
function isLineBreak(character: string): boolean {
  return character === '\n' || character === '\r';
}

/** Matches an unquoted keyword case-insensitively. */
function isKeyword(token: Token, keyword: string): boolean {
  return token.type === 'identifier' && token.value.toLowerCase() === keyword.toLowerCase();
}

/** Recognizes graph and digraph declarations. */
function isGraphType(token: Token): boolean {
  return isKeyword(token, 'graph') || isKeyword(token, 'digraph');
}

/** Tests whether a token can name a node or attribute. */
function isIdentifierLike(token: Token): boolean {
  return token.type === 'identifier' || token.type === 'string' || token.type === 'html';
}

/** Preserves the text of a DOT identifier. */
function parseIdentifierValue(token: Token): string {
  return token.value;
}

/** Preserves quoted text and converts unquoted numeric attributes. */
function parseAttributeValue(token: Token): unknown {
  if (token.type === 'string' || token.type === 'html') {
    return token.value;
  }
  if (token.type === 'identifier') {
    const numeric = Number(token.value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    return token.value;
  }
  throw new Error('Invalid attribute value in DOT input.');
}

/** Uses an explicit ID or generates a stable edge identifier. */
function deriveEdgeId(
  attributes: DOTAttributeMap,
  sourceId: string,
  targetId: string,
  counter: number
): string {
  const candidate = attributes.id ?? attributes.Id ?? attributes.ID;
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate);
  }
  return `${String(sourceId)}-${String(targetId)}-${counter}`;
}

/** Applies direction flags over the edge operator default. */
function deriveDirectedFlag(attributes: DOTAttributeMap, defaultDirected: boolean): boolean {
  const candidate = attributes.directed;
  if (typeof candidate === 'boolean') {
    return candidate;
  }

  const directionAttribute = attributes.dir;
  if (typeof directionAttribute === 'string') {
    const normalized = directionAttribute.toLowerCase();
    if (normalized === 'none') {
      return false;
    }
    return true;
  }

  return defaultDirected;
}
