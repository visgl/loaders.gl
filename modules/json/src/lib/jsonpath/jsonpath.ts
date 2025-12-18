// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

/**
 * A parser for a minimal subset of the jsonpath standard
 * Full JSON path parsers for JS exist but are quite large (bundle size)
 *
 * Supports
 *
 *   `$.component.component.component`
 */
export default class JSONPath {
  path: string[];

  constructor(path: JSONPath | string[] | string | null = null) {
    this.path = parseJsonPath(path);
  }

  clone(): JSONPath {
    return new JSONPath(this);
  }

  toString(): string {
    return formatJsonPath(this.path);
  }

  push(name: string): void {
    this.path.push(name);
  }

  pop() {
    return this.path.pop();
  }

  set(name: string): void {
    this.path[this.path.length - 1] = name;
  }

  equals(other: JSONPath): boolean {
    if (!this || !other || this.path.length !== other.path.length) {
      return false;
    }

    for (let i = 0; i < this.path.length; ++i) {
      if (this.path[i] !== other.path[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sets the value pointed at by path
   * TODO - handle root path
   * @param object
   * @param value
   */
  setFieldAtPath(object, value) {
    const path = [...this.path];
    path.shift();
    const field = path.pop();
    for (const component of path) {
      object = object[component];
    }
    // @ts-ignore
    object[field] = value;
  }

  /**
   * Gets the value pointed at by path
   * TODO - handle root path
   * @param object
   */
  getFieldAtPath(object) {
    const path = [...this.path];
    path.shift();
    const field = path.pop();
    for (const component of path) {
      object = object[component];
    }
    // @ts-ignore
    return object[field];
  }
}

type BracketSegment =
  | {type: 'property'; value: string; nextIndex: number}
  | {type: 'array-selector'; nextIndex: number};

function parseJsonPath(path: JSONPath | string[] | string | null): string[] {
  if (path instanceof JSONPath) {
    return [...path.path];
  }

  if (Array.isArray(path)) {
    return ['$'].concat(path);
  }

  if (typeof path === 'string') {
    return parseJsonPathString(path);
  }

  return ['$'];
}

// eslint-disable-next-line complexity, max-statements
function parseJsonPathString(pathString: string): string[] {
  const trimmedPath = pathString.trim();
  if (!trimmedPath.startsWith('$')) {
    throw new Error('JSONPath must start with $');
  }

  const segments: string[] = ['$'];
  let index = 1;
  let arrayElementSelectorEncountered = false;

  while (index < trimmedPath.length) {
    const character = trimmedPath[index];
    if (character === '.') {
      if (arrayElementSelectorEncountered) {
        throw new Error('JSONPath cannot select fields after array element selectors');
      }
      index += 1;
      if (trimmedPath[index] === '.') {
        throw new Error('JSONPath descendant selectors (..) are not supported');
      }
      const {value, nextIndex, isWildcard} = parseDotSegment(trimmedPath, index);
      if (isWildcard) {
        if (nextIndex < trimmedPath.length) {
          throw new Error('JSONPath wildcard selectors must terminate the path');
        }
        arrayElementSelectorEncountered = true;
        index = nextIndex;
        continue;
      }
      segments.push(value);
      index = nextIndex;
      continue;
    }

    if (character === '[') {
      const parsedSegment = parseBracketSegment(trimmedPath, index);
      if (parsedSegment.type === 'property') {
        if (arrayElementSelectorEncountered) {
          throw new Error('JSONPath cannot select fields after array element selectors');
        }
        segments.push(parsedSegment.value);
      } else {
        arrayElementSelectorEncountered = true;
      }
      index = parsedSegment.nextIndex;
      continue;
    }

    if (character === '@') {
      throw new Error('JSONPath current node selector (@) is not supported');
    }

    if (character.trim() === '') {
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character "${character}" in JSONPath`);
  }

  return segments;
}

function parseDotSegment(
  pathString: string,
  startIndex: number
): {
  value: string;
  nextIndex: number;
  isWildcard: boolean;
} {
  if (startIndex >= pathString.length) {
    throw new Error('JSONPath cannot end with a period');
  }

  if (pathString[startIndex] === '*') {
    return {value: '*', nextIndex: startIndex + 1, isWildcard: true};
  }

  const firstCharacter = pathString[startIndex];
  if (firstCharacter === '@') {
    throw new Error('JSONPath current node selector (@) is not supported');
  }
  if (!isIdentifierStartCharacter(firstCharacter)) {
    throw new Error('JSONPath property names after period must start with a letter, $ or _');
  }

  let endIndex = startIndex + 1;
  while (endIndex < pathString.length && isIdentifierCharacter(pathString[endIndex])) {
    endIndex++;
  }

  if (endIndex === startIndex) {
    throw new Error('JSONPath is missing a property name after period');
  }

  return {
    value: pathString.slice(startIndex, endIndex),
    nextIndex: endIndex,
    isWildcard: false
  };
}

function parseBracketSegment(pathString: string, startIndex: number): BracketSegment {
  const contentStartIndex = startIndex + 1;
  if (contentStartIndex >= pathString.length) {
    throw new Error('JSONPath has unterminated bracket');
  }

  const firstCharacter = pathString[contentStartIndex];
  if (firstCharacter === "'" || firstCharacter === '"') {
    const {value, nextIndex} = parseBracketProperty(pathString, contentStartIndex);
    return {type: 'property', value, nextIndex};
  }

  const closingBracketIndex = pathString.indexOf(']', contentStartIndex);
  if (closingBracketIndex === -1) {
    throw new Error('JSONPath has unterminated bracket');
  }

  const content = pathString.slice(contentStartIndex, closingBracketIndex).trim();
  const unsupportedSelectorMessage = getUnsupportedBracketSelectorMessage(content);
  if (unsupportedSelectorMessage) {
    throw new Error(unsupportedSelectorMessage);
  }
  if (content === '*') {
    return {type: 'array-selector', nextIndex: closingBracketIndex + 1};
  }

  if (/^\d+$/.test(content)) {
    throw new Error('JSONPath array index selectors are not supported');
  }

  if (/^\d*\s*:\s*\d*(\s*:\s*\d*)?$/.test(content)) {
    return {type: 'array-selector', nextIndex: closingBracketIndex + 1};
  }

  throw new Error(`Unsupported bracket selector "[${content}]" in JSONPath`);
}

function getUnsupportedBracketSelectorMessage(content: string): string | null {
  if (!content.length) {
    return 'JSONPath bracket selectors cannot be empty';
  }
  if (content.startsWith('?')) {
    return 'JSONPath filter selectors are not supported';
  }
  if (content.includes(',')) {
    return 'JSONPath union selectors are not supported';
  }
  if (content.startsWith('@') || content.includes('@.')) {
    return 'JSONPath current node selector (@) is not supported';
  }
  if (content.startsWith('(')) {
    return 'JSONPath script selectors are not supported';
  }
  return null;
}

// eslint-disable-next-line complexity, max-statements
function parseBracketProperty(
  pathString: string,
  startIndex: number
): {
  value: string;
  nextIndex: number;
} {
  const quoteCharacter = pathString[startIndex];
  let index = startIndex + 1;
  let value = '';
  let terminated = false;

  while (index < pathString.length) {
    const character = pathString[index];
    if (character === '\\') {
      index += 1;
      if (index >= pathString.length) {
        break;
      }
      value += pathString[index];
      index += 1;
      continue;
    }

    if (character === quoteCharacter) {
      terminated = true;
      index += 1;
      break;
    }

    value += character;
    index += 1;
  }

  if (!terminated) {
    throw new Error('JSONPath string in bracket property selector is unterminated');
  }

  while (index < pathString.length && pathString[index].trim() === '') {
    index += 1;
  }

  if (pathString[index] !== ']') {
    throw new Error('JSONPath property selectors must end with ]');
  }

  if (!value.length) {
    throw new Error('JSONPath property selectors cannot be empty');
  }

  return {value, nextIndex: index + 1};
}

function isIdentifierCharacter(character: string): boolean {
  return /[a-zA-Z0-9$_]/.test(character);
}

function isIdentifierStartCharacter(character: string): boolean {
  return /[a-zA-Z_$]/.test(character);
}

function isIdentifierSegment(segment: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment);
}

function formatJsonPath(path: string[]): string {
  return path
    .map((segment, index) => {
      if (index === 0) {
        return segment;
      }
      if (segment === '*') {
        return '.*';
      }
      if (isIdentifierSegment(segment)) {
        return `.${segment}`;
      }
      const escapedSegment = segment.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `['${escapedSegment}']`;
    })
    .join('');
}
