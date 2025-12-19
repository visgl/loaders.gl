// loaders.gl
// SPDX-License-Identifier: MIT AND BSD
// Copyright (c) vis.gl contributors
// This is a fork of the clarinet library, originally BSD license (see LICENSE file)
// loaders.gl changes:
// - typescript port

export type ClarinetEvent =
  | 'onvalue'
  | 'onstring'
  | 'onkey'
  | 'onopenobject'
  | 'oncloseobject'
  | 'onopenarray'
  | 'onclosearray'
  | 'onerror'
  | 'onend'
  | 'onready';

// Removes the MAX_BUFFER_LENGTH, originally set to 64 * 1024
const MAX_BUFFER_LENGTH = Number.MAX_SAFE_INTEGER;
// const DEBUG = false;

enum STATE {
  BEGIN = 0,
  VALUE, // general stuff
  OPEN_OBJECT, // {
  CLOSE_OBJECT, // }
  OPEN_ARRAY, // [
  CLOSE_ARRAY, // ]
  TEXT_ESCAPE, // \ stuff
  STRING, // ""
  BACKSLASH,
  END, // No more stack
  OPEN_KEY, // , "a"
  CLOSE_KEY, // :
  TRUE, // r
  TRUE2, // u
  TRUE3, // e
  FALSE, // a
  FALSE2, // l
  FALSE3, // s
  FALSE4, // e
  NULL, // u
  NULL2, // l
  NULL3, // l
  NUMBER_DECIMAL_POINT, // .
  NUMBER_DIGIT // [0-9]
}

const Char = {
  tab: 0x09, // \t
  lineFeed: 0x0a, // \n
  carriageReturn: 0x0d, // \r
  space: 0x20, // " "

  doubleQuote: 0x22, // "
  plus: 0x2b, // +
  comma: 0x2c, // ,
  minus: 0x2d, // -
  period: 0x2e, // .

  _0: 0x30, // 0
  _9: 0x39, // 9

  colon: 0x3a, // :

  E: 0x45, // E

  openBracket: 0x5b, // [
  backslash: 0x5c, // \
  closeBracket: 0x5d, // ]

  a: 0x61, // a
  b: 0x62, // b
  e: 0x65, // e
  f: 0x66, // f
  l: 0x6c, // l
  n: 0x6e, // n
  r: 0x72, // r
  s: 0x73, // s
  t: 0x74, // t
  u: 0x75, // u

  openBrace: 0x7b, // {
  closeBrace: 0x7d // }
};

const stringTokenPattern = /[\\"\n]/g;

type ParserEvent = (parser: ClarinetParser, event: string, data?: any) => void;

export type ClarinetParserOptions = {
  onready?: ParserEvent;
  onopenobject?: ParserEvent;
  onkey?: ParserEvent;
  oncloseobject?: ParserEvent;
  onopenarray?: ParserEvent;
  onclosearray?: ParserEvent;
  onvalue?: ParserEvent;
  onerror?: ParserEvent;
  onend?: ParserEvent;
  onchunkparsed?: ParserEvent;
};

const DEFAULT_OPTIONS: Required<ClarinetParserOptions> = {
  onready: () => {},
  onopenobject: () => {},
  onkey: () => {},
  oncloseobject: () => {},
  onopenarray: () => {},
  onclosearray: () => {},
  onvalue: () => {},
  onerror: () => {},
  onend: () => {},
  onchunkparsed: () => {}
};
export default class ClarinetParser {
  protected options: Required<ClarinetParserOptions> = DEFAULT_OPTIONS;

  bufferCheckPosition = MAX_BUFFER_LENGTH;
  q = '';
  c = '';
  p = '';
  closed = false;
  closedRoot = false;
  sawRoot = false;
  // tag = null;
  error: Error | null = null;
  state = STATE.BEGIN;
  stack: STATE[] = [];
  // mostly just for error reporting
  position: number = 0;
  column: number = 0;
  line: number = 1;
  slashed: boolean = false;
  unicodeI: number = 0;
  unicodeS: string | null = null;
  depth: number = 0;

  textNode;
  numberNode;

  constructor(options: ClarinetParserOptions = {}) {
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.textNode = undefined;
    this.numberNode = '';
    this.emit('onready');
  }

  end() {
    if (this.state !== STATE.VALUE || this.depth !== 0) this._error('Unexpected end');

    this._closeValue();
    this.c = '';
    this.closed = true;
    this.emit('onend');
    return this;
  }

  resume() {
    this.error = null;
    return this;
  }

  close() {
    return this.write(null);
  }

  // protected

  emit(event: string, data?: any): void {
    // if (DEBUG) console.log('-- emit', event, data);
    this.options[event]?.(data, this);
  }

  emitNode(event: string, data?: any): void {
    this._closeValue();
    this.emit(event, data);
  }

  /* eslint-disable no-continue */
  // eslint-disable-next-line complexity, max-statements
  write(chunk) {
    if (this.error) {
      throw this.error;
    }
    if (this.closed) {
      return this._error('Cannot write after close. Assign an onready handler.');
    }
    if (chunk === null) {
      return this.end();
    }
    let i = 0;
    let c = chunk.charCodeAt(0);
    let p = this.p;
    // if (DEBUG) console.log(`write -> [${  chunk  }]`);
    while (c) {
      p = c;
      this.c = c = chunk.charCodeAt(i++);
      // if chunk doesnt have next, like streaming char by char
      // this way we need to check if previous is really previous
      // if not we need to reset to what the this says is the previous
      // from buffer
      if (p !== c) {
        this.p = p;
      } else {
        p = this.p;
      }

      if (!c) break;

      // if (DEBUG) console.log(i, c, STATE[this.state]);
      this.position++;
      if (c === Char.lineFeed) {
        this.line++;
        this.column = 0;
      } else this.column++;

      switch (this.state) {
        case STATE.BEGIN:
          if (c === Char.openBrace) this.state = STATE.OPEN_OBJECT;
          else if (c === Char.openBracket) this.state = STATE.OPEN_ARRAY;
          else if (!isWhitespace(c)) {
            this._error('Non-whitespace before {[.');
          }
          continue;

        case STATE.OPEN_KEY:
        case STATE.OPEN_OBJECT:
          if (isWhitespace(c)) continue;
          if (this.state === STATE.OPEN_KEY) this.stack.push(STATE.CLOSE_KEY);
          else if (c === Char.closeBrace) {
            this.emit('onopenobject');
            this.depth++;
            this.emit('oncloseobject');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
            continue;
          } else this.stack.push(STATE.CLOSE_OBJECT);
          if (c === Char.doubleQuote) this.state = STATE.STRING;
          else this._error('Malformed object key should start with "');
          continue;

        case STATE.CLOSE_KEY:
        case STATE.CLOSE_OBJECT:
          if (isWhitespace(c)) continue;
          // let event = this.state === STATE.CLOSE_KEY ? 'key' : 'object';
          if (c === Char.colon) {
            if (this.state === STATE.CLOSE_OBJECT) {
              this.stack.push(STATE.CLOSE_OBJECT);
              this._closeValue('onopenobject');
              this.depth++;
            } else this._closeValue('onkey');
            this.state = STATE.VALUE;
          } else if (c === Char.closeBrace) {
            this.emitNode('oncloseobject');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
          } else if (c === Char.comma) {
            if (this.state === STATE.CLOSE_OBJECT) this.stack.push(STATE.CLOSE_OBJECT);
            this._closeValue();
            this.state = STATE.OPEN_KEY;
          } else this._error('Bad object');
          continue;

        case STATE.OPEN_ARRAY: // after an array there always a value
        case STATE.VALUE:
          if (isWhitespace(c)) continue;
          if (this.state === STATE.OPEN_ARRAY) {
            this.emit('onopenarray');
            this.depth++;
            this.state = STATE.VALUE;
            if (c === Char.closeBracket) {
              this.emit('onclosearray');
              this.depth--;
              this.state = this.stack.pop() || STATE.VALUE;
              continue;
            } else {
              this.stack.push(STATE.CLOSE_ARRAY);
            }
          }
          if (c === Char.doubleQuote) this.state = STATE.STRING;
          else if (c === Char.openBrace) this.state = STATE.OPEN_OBJECT;
          else if (c === Char.openBracket) this.state = STATE.OPEN_ARRAY;
          else if (c === Char.t) this.state = STATE.TRUE;
          else if (c === Char.f) this.state = STATE.FALSE;
          else if (c === Char.n) this.state = STATE.NULL;
          else if (c === Char.minus) {
            // keep and continue
            this.numberNode += '-';
          } else if (Char._0 <= c && c <= Char._9) {
            this.numberNode += String.fromCharCode(c);
            this.state = STATE.NUMBER_DIGIT;
          } else this._error('Bad value');
          continue;

        case STATE.CLOSE_ARRAY:
          if (c === Char.comma) {
            this.stack.push(STATE.CLOSE_ARRAY);
            this._closeValue('onvalue');
            this.state = STATE.VALUE;
          } else if (c === Char.closeBracket) {
            this.emitNode('onclosearray');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
          } else if (isWhitespace(c)) continue;
          else this._error('Bad array');
          continue;

        case STATE.STRING:
          if (this.textNode === undefined) {
            this.textNode = '';
          }

          // thanks thejh, this is an about 50% performance improvement.
          let starti = i - 1;
          let slashed = this.slashed;
          let unicodeI = this.unicodeI;
          // eslint-disable-next-line no-constant-condition, no-labels
          STRING_BIGLOOP: while (true) {
            // if (DEBUG) console.log(i, c, STATE[this.state], slashed);
            // zero means "no unicode active". 1-4 mean "parse some more". end after 4.
            while (unicodeI > 0) {
              this.unicodeS += String.fromCharCode(c);
              c = chunk.charCodeAt(i++);
              this.position++;
              if (unicodeI === 4) {
                // TODO this might be slow? well, probably not used too often anyway
                this.textNode += String.fromCharCode(parseInt(this.unicodeS as string, 16));
                unicodeI = 0;
                starti = i - 1;
              } else {
                unicodeI++;
              }
              // we can just break here: no stuff we skipped that still has to be sliced out or so
              // eslint-disable-next-line no-labels
              if (!c) break STRING_BIGLOOP;
            }
            if (c === Char.doubleQuote && !slashed) {
              this.state = this.stack.pop() || STATE.VALUE;
              this.textNode += chunk.substring(starti, i - 1);
              this.position += i - 1 - starti;
              break;
            }
            if (c === Char.backslash && !slashed) {
              slashed = true;
              this.textNode += chunk.substring(starti, i - 1);
              this.position += i - 1 - starti;
              c = chunk.charCodeAt(i++);
              this.position++;
              if (!c) break;
            }
            if (slashed) {
              slashed = false;
              if (c === Char.n) {
                this.textNode += '\n';
              } else if (c === Char.r) {
                this.textNode += '\r';
              } else if (c === Char.t) {
                this.textNode += '\t';
              } else if (c === Char.f) {
                this.textNode += '\f';
              } else if (c === Char.b) {
                this.textNode += '\b';
              } else if (c === Char.u) {
                // \uxxxx. meh!
                unicodeI = 1;
                this.unicodeS = '';
              } else {
                this.textNode += String.fromCharCode(c);
              }
              c = chunk.charCodeAt(i++);
              this.position++;
              starti = i - 1;
              if (!c) break;
              else continue;
            }

            stringTokenPattern.lastIndex = i;
            const reResult = stringTokenPattern.exec(chunk);
            if (reResult === null) {
              i = chunk.length + 1;
              this.textNode += chunk.substring(starti, i - 1);
              this.position += i - 1 - starti;
              break;
            }
            i = reResult.index + 1;
            c = chunk.charCodeAt(reResult.index);
            if (!c) {
              this.textNode += chunk.substring(starti, i - 1);
              this.position += i - 1 - starti;
              break;
            }
          }
          this.slashed = slashed;
          this.unicodeI = unicodeI;
          continue;

        case STATE.TRUE:
          if (c === Char.r) this.state = STATE.TRUE2;
          else this._error(`Invalid true started with t${c}`);
          continue;

        case STATE.TRUE2:
          if (c === Char.u) this.state = STATE.TRUE3;
          else this._error(`Invalid true started with tr${c}`);
          continue;

        case STATE.TRUE3:
          if (c === Char.e) {
            this.emit('onvalue', true);
            this.state = this.stack.pop() || STATE.VALUE;
          } else this._error(`Invalid true started with tru${c}`);
          continue;

        case STATE.FALSE:
          if (c === Char.a) this.state = STATE.FALSE2;
          else this._error(`Invalid false started with f${c}`);
          continue;

        case STATE.FALSE2:
          if (c === Char.l) this.state = STATE.FALSE3;
          else this._error(`Invalid false started with fa${c}`);
          continue;

        case STATE.FALSE3:
          if (c === Char.s) this.state = STATE.FALSE4;
          else this._error(`Invalid false started with fal${c}`);
          continue;

        case STATE.FALSE4:
          if (c === Char.e) {
            this.emit('onvalue', false);
            this.state = this.stack.pop() || STATE.VALUE;
          } else this._error(`Invalid false started with fals${c}`);
          continue;

        case STATE.NULL:
          if (c === Char.u) this.state = STATE.NULL2;
          else this._error(`Invalid null started with n${c}`);
          continue;

        case STATE.NULL2:
          if (c === Char.l) this.state = STATE.NULL3;
          else this._error(`Invalid null started with nu${c}`);
          continue;

        case STATE.NULL3:
          if (c === Char.l) {
            this.emit('onvalue', null);
            this.state = this.stack.pop() || STATE.VALUE;
          } else this._error(`Invalid null started with nul${c}`);
          continue;

        case STATE.NUMBER_DECIMAL_POINT:
          if (c === Char.period) {
            this.numberNode += '.';
            this.state = STATE.NUMBER_DIGIT;
          } else this._error('Leading zero not followed by .');
          continue;

        case STATE.NUMBER_DIGIT:
          if (Char._0 <= c && c <= Char._9) this.numberNode += String.fromCharCode(c);
          else if (c === Char.period) {
            if (this.numberNode.indexOf('.') !== -1) this._error('Invalid number has two dots');
            this.numberNode += '.';
          } else if (c === Char.e || c === Char.E) {
            if (this.numberNode.indexOf('e') !== -1 || this.numberNode.indexOf('E') !== -1)
              this._error('Invalid number has two exponential');
            this.numberNode += 'e';
          } else if (c === Char.plus || c === Char.minus) {
            // @ts-expect-error
            if (!(p === Char.e || p === Char.E)) this._error('Invalid symbol in number');
            this.numberNode += String.fromCharCode(c);
          } else {
            this._closeNumber();
            i--; // go back one
            this.state = this.stack.pop() || STATE.VALUE;
          }
          continue;

        default:
          this._error(`Unknown state: ${this.state}`);
      }
    }
    if (this.position >= this.bufferCheckPosition) {
      checkBufferLength(this);
    }

    this.emit('onchunkparsed');

    return this;
  }

  _closeValue(event: string = 'onvalue'): void {
    if (this.textNode !== undefined) {
      this.emit(event, this.textNode);
    }
    this.textNode = undefined;
  }

  _closeNumber(): void {
    if (this.numberNode) this.emit('onvalue', parseFloat(this.numberNode));
    this.numberNode = '';
  }

  _error(message: string = ''): void {
    this._closeValue();
    message += `\nLine: ${this.line}\nColumn: ${this.column}\nChar: ${this.c}`;
    const error = new Error(message);
    this.error = error;
    this.emit('onerror', error);
  }
}

function isWhitespace(c): boolean {
  return c === Char.carriageReturn || c === Char.lineFeed || c === Char.space || c === Char.tab;
}

function checkBufferLength(parser) {
  const maxAllowed = Math.max(MAX_BUFFER_LENGTH, 10);
  let maxActual = 0;

  for (const buffer of ['textNode', 'numberNode']) {
    const len = parser[buffer] === undefined ? 0 : parser[buffer].length;
    if (len > maxAllowed) {
      switch (buffer) {
        case 'text':
          // TODO - should this be closeValue?
          // closeText(parser);
          break;

        default:
          parser._error(`Max buffer length exceeded: ${buffer}`);
      }
    }
    maxActual = Math.max(maxActual, len);
  }
  parser.bufferCheckPosition = MAX_BUFFER_LENGTH - maxActual + parser.position;
}
