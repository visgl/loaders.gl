// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import JSONPath from '../jsonpath/jsonpath';
import type {
  StreamingJSONParserLike,
  StreamingJSONParserOptions
} from './streaming-json-parser-types';

type ObjectFrame = {
  type: 'object';
  path: string[];
  expecting: 'keyOrEnd' | 'colon' | 'value' | 'commaOrEnd';
  currentKey: string | null;
};

type ArrayFrame = {
  type: 'array';
  path: string[];
  expecting: 'valueOrEnd' | 'commaOrEnd';
};

type Frame = ObjectFrame | ArrayFrame;

type StringContext = {
  forKey: boolean;
  escape: boolean;
  unicodeDigitsRemaining: number;
  unicodeHex: string;
  keyText: string;
};

/**
 * Streaming JSON parser optimized for extracting one matching array from the input.
 */
export default class FastStreamingJSONParser implements StreamingJSONParserLike {
  private readonly allowedJsonPaths: string[][];
  private readonly trackMetadata: boolean;

  private mode: 'seek' | 'stream' | 'after' = 'seek';
  private streamingJsonPath: JSONPath | null = null;
  private partialResult: unknown = null;
  private finalResult: unknown = null;
  private emittedRows: unknown[] = [];

  private readonly seekFrames: Frame[] = [];
  private seekStringContext: StringContext | null = null;
  private seekPrimitiveActive = false;
  private seekRootComplete = false;

  private streamBuffer = '';
  private streamElementType: 'none' | 'string' | 'primitive' | 'complex' = 'none';
  private streamElementBuffer = '';
  private streamElementDepth = 0;
  private streamInString = false;
  private streamEscape = false;
  private streamUnicodeDigitsRemaining = 0;
  private targetArrayClosed = false;

  private fullText = '';

  constructor(options: StreamingJSONParserOptions = {}) {
    this.allowedJsonPaths = (options.jsonpaths || []).map(jsonpath => new JSONPath(jsonpath).path);
    this.trackMetadata = Boolean(options.metadata);
  }

  /** @inheritdoc */
  write(chunk: string): unknown[] {
    const chunkStartOffset = this.fullText.length;

    if (this.trackMetadata) {
      this.fullText += chunk;
    }

    let streamChunk = '';

    if (this.mode === 'seek') {
      const streamStartIndex = this.scanForStreamingArray(chunk, chunkStartOffset);
      if (streamStartIndex !== null) {
        streamChunk = chunk.slice(streamStartIndex);
      }
    } else if (this.mode === 'stream') {
      streamChunk = chunk;
    }

    if (streamChunk) {
      this.streamBuffer += streamChunk;
      this.parseStreamBuffer();
    }

    const rows = this.emittedRows;
    this.emittedRows = [];
    return rows;
  }

  /** @inheritdoc */
  close(): void {
    if (this.mode === 'stream') {
      this.parseStreamBuffer();
    }

    if (!this.trackMetadata || this.streamingJsonPath) {
      return;
    }

    try {
      this.finalResult = JSON.parse(this.fullText);
    } catch {
      this.finalResult = this.partialResult;
    }
  }

  /** @inheritdoc */
  getPartialResult(): unknown {
    if (this.streamingJsonPath) {
      return this.partialResult;
    }
    return this.finalResult ?? this.partialResult;
  }

  /** @inheritdoc */
  getStreamingJsonPath(): JSONPath | null {
    return this.streamingJsonPath;
  }

  /** @inheritdoc */
  getStreamingJsonPathAsString(): string | null {
    return this.streamingJsonPath?.toString() || null;
  }

  /**
   * Scans input until the matching array start is found.
   */
  private scanForStreamingArray(chunk: string, chunkStartOffset: number): number | null {
    let index = 0;

    while (index < chunk.length && !this.seekRootComplete) {
      const character = chunk[index];

      if (this.seekStringContext) {
        this.consumeSeekStringCharacter(character);
        index++;
        continue;
      }

      if (this.seekPrimitiveActive) {
        if (isValueDelimiter(character)) {
          this.seekPrimitiveActive = false;
          this.finishSeekValue();
          continue;
        }
        index++;
        continue;
      }

      const frame = this.seekFrames[this.seekFrames.length - 1];

      if (!frame) {
        if (isWhitespace(character)) {
          index++;
          continue;
        }
        const streamStartIndex = this.handleSeekValueStart(
          ['$'],
          character,
          chunkStartOffset + index
        );
        if (streamStartIndex !== null) {
          return streamStartIndex - chunkStartOffset;
        }
        index++;
        continue;
      }

      if (frame.type === 'object') {
        switch (frame.expecting) {
          case 'keyOrEnd':
            if (isWhitespace(character)) {
              index++;
              continue;
            }
            if (character === '"') {
              this.seekStringContext = createStringContext(true);
            } else if (character === '}') {
              this.seekFrames.pop();
              this.finishSeekValue();
            }
            index++;
            continue;

          case 'colon':
            if (isWhitespace(character)) {
              index++;
              continue;
            }
            if (character === ':') {
              frame.expecting = 'value';
            }
            index++;
            continue;

          case 'value':
            if (isWhitespace(character)) {
              index++;
              continue;
            }
            if (frame.currentKey) {
              const streamStartIndex = this.handleSeekValueStart(
                [...frame.path, frame.currentKey],
                character,
                chunkStartOffset + index
              );
              if (streamStartIndex !== null) {
                return streamStartIndex - chunkStartOffset;
              }
            }
            index++;
            continue;

          case 'commaOrEnd':
            if (isWhitespace(character)) {
              index++;
              continue;
            }
            if (character === ',') {
              frame.currentKey = null;
              frame.expecting = 'keyOrEnd';
            } else if (character === '}') {
              this.seekFrames.pop();
              this.finishSeekValue();
            }
            index++;
            continue;
        }
      }

      switch (frame.expecting) {
        case 'valueOrEnd':
          if (isWhitespace(character)) {
            index++;
            continue;
          }
          if (character === ']') {
            this.seekFrames.pop();
            this.finishSeekValue();
            index++;
            continue;
          }
          const streamStartIndex = this.handleSeekValueStart(
            [...frame.path],
            character,
            chunkStartOffset + index
          );
          if (streamStartIndex !== null) {
            return streamStartIndex - chunkStartOffset;
          }
          index++;
          continue;

        case 'commaOrEnd':
          if (isWhitespace(character)) {
            index++;
            continue;
          }
          if (character === ',') {
            frame.expecting = 'valueOrEnd';
          } else if (character === ']') {
            this.seekFrames.pop();
            this.finishSeekValue();
          }
          index++;
          continue;
      }
    }

    return null;
  }

  /**
   * Handles the start of a value while seeking the streaming array.
   */
  private handleSeekValueStart(
    valuePath: string[],
    character: string,
    absoluteIndex: number
  ): number | null {
    if (character === '{') {
      this.seekFrames.push({
        type: 'object',
        path: valuePath,
        expecting: 'keyOrEnd',
        currentKey: null
      });
      return null;
    }

    if (character === '[') {
      if (!this.streamingJsonPath && this.matchesPath(valuePath)) {
        this.streamingJsonPath = new JSONPath(valuePath.slice(1));
        this.mode = 'stream';
        this.buildPartialResult(absoluteIndex);
        return absoluteIndex + 1;
      }

      this.seekFrames.push({
        type: 'array',
        path: valuePath,
        expecting: 'valueOrEnd'
      });
      return null;
    }

    if (character === '"') {
      this.seekStringContext = createStringContext(false);
      return null;
    }

    this.seekPrimitiveActive = true;
    return null;
  }

  /**
   * Consumes one character while scanning a JSON string in seek mode.
   */
  private consumeSeekStringCharacter(character: string): void {
    const context = this.seekStringContext;

    if (!context) {
      return;
    }

    if (context.unicodeDigitsRemaining > 0) {
      context.unicodeHex += character;
      context.unicodeDigitsRemaining--;
      if (context.unicodeDigitsRemaining === 0 && context.forKey) {
        context.keyText += String.fromCharCode(Number.parseInt(context.unicodeHex, 16));
        context.unicodeHex = '';
      }
      return;
    }

    if (context.escape) {
      context.escape = false;
      if (character === 'u') {
        context.unicodeDigitsRemaining = 4;
        context.unicodeHex = '';
        return;
      }
      if (context.forKey) {
        context.keyText += decodeEscapedCharacter(character);
      }
      return;
    }

    if (character === '\\') {
      context.escape = true;
      return;
    }

    if (character === '"') {
      this.seekStringContext = null;
      if (context.forKey) {
        const frame = this.seekFrames[this.seekFrames.length - 1];
        if (frame?.type === 'object') {
          frame.currentKey = context.keyText;
          frame.expecting = 'colon';
        }
      } else {
        this.finishSeekValue();
      }
      return;
    }

    if (context.forKey) {
      context.keyText += character;
    }
  }

  /**
   * Marks the current value as complete in seek mode.
   */
  private finishSeekValue(): void {
    const frame = this.seekFrames[this.seekFrames.length - 1];

    if (!frame) {
      this.seekRootComplete = true;
      return;
    }

    if (frame.type === 'object') {
      frame.currentKey = null;
      frame.expecting = 'commaOrEnd';
      return;
    }

    frame.expecting = 'commaOrEnd';
  }

  /**
   * Parses the target array contents and emits complete top-level rows.
   */
  private parseStreamBuffer(): void {
    let index = 0;

    while (index < this.streamBuffer.length && !this.targetArrayClosed) {
      const character = this.streamBuffer[index];

      if (this.streamElementType === 'none') {
        if (isWhitespace(character) || character === ',') {
          index++;
          continue;
        }
        if (character === ']') {
          this.targetArrayClosed = true;
          this.mode = 'after';
          index++;
          continue;
        }

        if (character === '"') {
          this.streamElementType = 'string';
          this.streamElementBuffer = '"';
          this.streamInString = true;
          this.streamEscape = false;
          this.streamUnicodeDigitsRemaining = 0;
          index++;
          continue;
        }

        if (character === '{' || character === '[') {
          this.streamElementType = 'complex';
          this.streamElementBuffer = character;
          this.streamElementDepth = 1;
          this.streamInString = false;
          this.streamEscape = false;
          this.streamUnicodeDigitsRemaining = 0;
          index++;
          continue;
        }

        this.streamElementType = 'primitive';
        this.streamElementBuffer = character;
        index++;
        continue;
      }

      if (this.streamElementType === 'primitive') {
        if (isStreamElementDelimiter(character)) {
          this.emitStreamElement();
          continue;
        }
        this.streamElementBuffer += character;
        index++;
        continue;
      }

      this.streamElementBuffer += character;

      if (this.streamUnicodeDigitsRemaining > 0) {
        this.streamUnicodeDigitsRemaining--;
        index++;
        continue;
      }

      if (this.streamEscape) {
        this.streamEscape = false;
        if (character === 'u') {
          this.streamUnicodeDigitsRemaining = 4;
        }
        index++;
        continue;
      }

      if (character === '\\') {
        this.streamEscape = true;
        index++;
        continue;
      }

      if (character === '"') {
        this.streamInString = !this.streamInString;
        if (this.streamElementType === 'string' && !this.streamInString) {
          this.emitStreamElement();
        }
        index++;
        continue;
      }

      if (!this.streamInString && this.streamElementType === 'complex') {
        if (character === '{' || character === '[') {
          this.streamElementDepth++;
        } else if (character === '}' || character === ']') {
          this.streamElementDepth--;
          if (this.streamElementDepth === 0) {
            this.emitStreamElement();
          }
        }
      }

      index++;
    }

    this.streamBuffer = this.targetArrayClosed ? '' : this.streamBuffer.slice(index);
  }

  /**
   * Emits the currently buffered stream element.
   */
  private emitStreamElement(): void {
    if (!this.streamElementBuffer) {
      this.resetStreamElement();
      return;
    }

    try {
      this.emittedRows.push(JSON.parse(this.streamElementBuffer));
    } catch {
      // Ignore incomplete elements until more data arrives.
    }

    this.resetStreamElement();
  }

  /**
   * Resets per-element stream parsing state.
   */
  private resetStreamElement(): void {
    this.streamElementType = 'none';
    this.streamElementBuffer = '';
    this.streamElementDepth = 0;
    this.streamInString = false;
    this.streamEscape = false;
    this.streamUnicodeDigitsRemaining = 0;
  }

  /**
   * Builds the partial wrapper object for metadata batches.
   */
  private buildPartialResult(targetArrayStartOffset: number): void {
    if (!this.trackMetadata) {
      return;
    }

    if (!this.streamingJsonPath || this.streamingJsonPath.path.length === 1) {
      this.partialResult = [];
      return;
    }

    const prefix = this.fullText.slice(0, targetArrayStartOffset);
    const suffix = this.seekFrames
      .slice()
      .reverse()
      .map(frame => (frame.type === 'object' ? '}' : ']'))
      .join('');

    try {
      this.partialResult = JSON.parse(`${prefix}[]${suffix}`);
    } catch {
      this.partialResult = null;
    }
  }

  /**
   * Checks whether the current path matches one of the configured JSON paths.
   */
  private matchesPath(path: string[]): boolean {
    if (this.allowedJsonPaths.length === 0) {
      return true;
    }

    return this.allowedJsonPaths.some(jsonPath => pathsEqual(jsonPath, path));
  }
}

/**
 * Creates string parsing state for seek mode.
 */
function createStringContext(forKey: boolean): StringContext {
  return {
    forKey,
    escape: false,
    unicodeDigitsRemaining: 0,
    unicodeHex: '',
    keyText: ''
  };
}

/**
 * Compares two JSON path arrays.
 */
function pathsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

/**
 * Decodes a single escaped JSON character.
 */
function decodeEscapedCharacter(character: string): string {
  switch (character) {
    case '"':
      return '"';
    case '\\':
      return '\\';
    case '/':
      return '/';
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    default:
      return character;
  }
}

/**
 * Checks whether a character is JSON whitespace.
 */
function isWhitespace(character: string): boolean {
  return character === ' ' || character === '\n' || character === '\r' || character === '\t';
}

/**
 * Checks whether a character terminates a primitive JSON value.
 */
function isValueDelimiter(character: string): boolean {
  return isWhitespace(character) || character === ',' || character === '}' || character === ']';
}

/**
 * Checks whether a character terminates a streamed top-level array element.
 */
function isStreamElementDelimiter(character: string): boolean {
  return isWhitespace(character) || character === ',' || character === ']';
}
