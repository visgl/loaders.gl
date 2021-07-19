// Forked from clarinet under BSD license
/* eslint-disable no-continue, no-labels, no-constant-condition */

export const EVENTS = [
  'value',
  'string',
  'key',
  'openobject',
  'closeobject',
  'openarray',
  'closearray',
  'error',
  'end',
  'ready'
];

// Removes the MAX_BUFFER_LENGTH, originally set to 64 * 1024
const MAX_BUFFER_LENGTH = Number.MAX_SAFE_INTEGER;
// const DEBUG = false;

const buffers = {
  textNode: undefined,
  numberNode: ''
};

let S = 0;

const STATE: Record<string, number | string> = {
  BEGIN: S++,
  VALUE: S++, // general stuff
  OPEN_OBJECT: S++, // {
  CLOSE_OBJECT: S++, // }
  OPEN_ARRAY: S++, // [
  CLOSE_ARRAY: S++, // ]
  TEXT_ESCAPE: S++, // \ stuff
  STRING: S++, // ""
  BACKSLASH: S++,
  END: S++, // No more stack
  OPEN_KEY: S++, // , "a"
  CLOSE_KEY: S++, // :
  TRUE: S++, // r
  TRUE2: S++, // u
  TRUE3: S++, // e
  FALSE: S++, // a
  FALSE2: S++, // l
  FALSE3: S++, // s
  FALSE4: S++, // e
  NULL: S++, // u
  NULL2: S++, // l
  NULL3: S++, // l
  NUMBER_DECIMAL_POINT: S++, // .
  NUMBER_DIGIT: S++ // [0-9]
};

for (const s_ in STATE) {
  STATE[STATE[s_]] = s_;
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

function checkBufferLength(parser) {
  const maxAllowed = Math.max(MAX_BUFFER_LENGTH, 10);
  let maxActual = 0;

  for (const buffer in buffers) {
    const len = parser[buffer] === undefined ? 0 : parser[buffer].length;
    if (len > maxAllowed) {
      switch (buffer) {
        case 'text':
          // this does not seem to be defined
          // closeText(parser);
          break;

        default:
          error(parser, `Max buffer length exceeded: ${buffer}`);
      }
    }
    maxActual = Math.max(maxActual, len);
  }
  parser.bufferCheckPosition = MAX_BUFFER_LENGTH - maxActual + parser.position;
}

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
  options: Required<ClarinetParserOptions> = DEFAULT_OPTIONS;

  bufferCheckPosition = MAX_BUFFER_LENGTH;
  q = '';
  c = '';
  p = '';
  closed = false;
  closedRoot = false;
  sawRoot = false;
  tag = null;
  error: Error | null = null;
  state = STATE.BEGIN;
  stack: (number | string)[] = [];
  // mostly just for error reporting
  position = 0;
  column = 0;
  line = 1;
  slashed = false;
  unicodeI = 0;
  unicodeS: string | null = null;
  depth = 0;

  // buffers
  textNode: string | undefined = undefined;
  numberNode = '';

  onready: ParserEvent = () => {};
  onopenobject: ParserEvent = () => {};
  onkey: ParserEvent = () => {};
  oncloseobject: ParserEvent = () => {};
  onopenarray: ParserEvent = () => {};
  onclosearray: ParserEvent = () => {};
  onvalue: ParserEvent = () => {};
  onerror: ParserEvent = () => {};
  onend: ParserEvent = () => {};
  onchunkparsed: ParserEvent = () => {};

  constructor(options: ClarinetParserOptions = {}) {
    this.options = {...this.options, ...options};

    // install callbacks
    this.onready = this.options.onready;
    this.onopenobject = this.options.onopenobject;
    this.onkey = this.options.onkey;
    this.oncloseobject = this.options.oncloseobject;
    this.onopenarray = this.options.onopenarray;
    this.onclosearray = this.options.onclosearray;
    this.onvalue = this.options.onvalue;
    this.onerror = this.options.onerror;
    this.onend = this.options.onend;
    this.onchunkparsed = this.options.onchunkparsed;

    emit(this, 'onready');
  }

  end() {
    if (this.state !== STATE.VALUE || this.depth !== 0) {
      error(this, 'Unexpected end');
    }

    closeValue(this);
    this.c = '';
    this.closed = true;
    emit(this, 'onend');
    return this;
  }

  resume() {
    this.error = null;
    return this;
  }

  close() {
    return this.write(null);
  }

  // eslint-disable-next-line max-statements, complexity
  write(chunk) {
    if (this.error) {
      throw this.error;
    }
    if (this.closed) {
      return error(this, 'Cannot write after close. Assign an onready handler.');
    }
    if (chunk === null) {
      return this.end();
    }
    let i = 0;
    let c = chunk.charCodeAt(0);
    let p = this.p;
    // if (DEBUG) console.log('write -> [' + chunk + ']');
    while (c) {
      p = c;
      this.c = c = chunk.charCodeAt(i++);
      // if chunk doesn't have next, like streaming char by char
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
            error(this, 'Non-whitespace before {[.');
          }
          continue;

        case STATE.OPEN_KEY:
        case STATE.OPEN_OBJECT:
          if (isWhitespace(c)) continue;
          if (this.state === STATE.OPEN_KEY) this.stack.push(STATE.CLOSE_KEY);
          else if (c === Char.closeBrace) {
            emit(this, 'onopenobject');
            this.depth++;
            emit(this, 'oncloseobject');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
            continue;
          } else this.stack.push(STATE.CLOSE_OBJECT);
          if (c === Char.doubleQuote) this.state = STATE.STRING;
          else error(this, 'Malformed object key should start with "');
          continue;

        case STATE.CLOSE_KEY:
        case STATE.CLOSE_OBJECT:
          if (isWhitespace(c)) continue;
          // var event = this.state === STATE.CLOSE_KEY ? 'key' : 'object';
          if (c === Char.colon) {
            if (this.state === STATE.CLOSE_OBJECT) {
              this.stack.push(STATE.CLOSE_OBJECT);
              closeValue(this, 'onopenobject');
              this.depth++;
            } else closeValue(this, 'onkey');
            this.state = STATE.VALUE;
          } else if (c === Char.closeBrace) {
            emitNode(this, 'oncloseobject');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
          } else if (c === Char.comma) {
            if (this.state === STATE.CLOSE_OBJECT) this.stack.push(STATE.CLOSE_OBJECT);
            closeValue(this);
            this.state = STATE.OPEN_KEY;
          } else error(this, 'Bad object');
          continue;

        case STATE.OPEN_ARRAY: // after an array there always a value
        case STATE.VALUE:
          if (isWhitespace(c)) continue;
          if (this.state === STATE.OPEN_ARRAY) {
            emit(this, 'onopenarray');
            this.depth++;
            this.state = STATE.VALUE;
            if (c === Char.closeBracket) {
              emit(this, 'onclosearray');
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
          } else error(this, 'Bad value');
          continue;

        case STATE.CLOSE_ARRAY:
          if (c === Char.comma) {
            this.stack.push(STATE.CLOSE_ARRAY);
            closeValue(this, 'onvalue');
            this.state = STATE.VALUE;
          } else if (c === Char.closeBracket) {
            emitNode(this, 'onclosearray');
            this.depth--;
            this.state = this.stack.pop() || STATE.VALUE;
          } else if (isWhitespace(c)) continue;
          else error(this, 'Bad array');
          continue;

        case STATE.STRING:
          if (this.textNode === undefined) {
            this.textNode = '';
          }

          // thanks thejh, this is an about 50% performance improvement.
          let starti = i - 1;
          let slashed = this.slashed;
          let unicodeI = this.unicodeI;
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
          else error(this, `Invalid true started with t${c}`);
          continue;

        case STATE.TRUE2:
          if (c === Char.u) this.state = STATE.TRUE3;
          else error(this, `Invalid true started with tr${c}`);
          continue;

        case STATE.TRUE3:
          if (c === Char.e) {
            emit(this, 'onvalue', true);
            this.state = this.stack.pop() || STATE.VALUE;
          } else error(this, `Invalid true started with tru${c}`);
          continue;

        case STATE.FALSE:
          if (c === Char.a) this.state = STATE.FALSE2;
          else error(this, `Invalid false started with f${c}`);
          continue;

        case STATE.FALSE2:
          if (c === Char.l) this.state = STATE.FALSE3;
          else error(this, `Invalid false started with fa${c}`);
          continue;

        case STATE.FALSE3:
          if (c === Char.s) this.state = STATE.FALSE4;
          else error(this, `Invalid false started with fal${c}`);
          continue;

        case STATE.FALSE4:
          if (c === Char.e) {
            emit(this, 'onvalue', false);
            this.state = this.stack.pop() || STATE.VALUE;
          } else error(this, `Invalid false started with fals${c}`);
          continue;

        case STATE.NULL:
          if (c === Char.u) this.state = STATE.NULL2;
          else error(this, `Invalid null started with n${c}`);
          continue;

        case STATE.NULL2:
          if (c === Char.l) this.state = STATE.NULL3;
          else error(this, `Invalid null started with nu${c}`);
          continue;

        case STATE.NULL3:
          if (c === Char.l) {
            emit(this, 'onvalue', null);
            this.state = this.stack.pop() || STATE.VALUE;
          } else error(this, `Invalid null started with nul${c}`);
          continue;

        case STATE.NUMBER_DECIMAL_POINT:
          if (c === Char.period) {
            this.numberNode += '.';
            this.state = STATE.NUMBER_DIGIT;
          } else error(this, 'Leading zero not followed by .');
          continue;

        case STATE.NUMBER_DIGIT:
          if (Char._0 <= c && c <= Char._9) this.numberNode += String.fromCharCode(c);
          else if (c === Char.period) {
            if (this.numberNode.indexOf('.') !== -1) error(this, 'Invalid number has two dots');
            this.numberNode += '.';
          } else if (c === Char.e || c === Char.E) {
            if (this.numberNode.indexOf('e') !== -1 || this.numberNode.indexOf('E') !== -1)
              error(this, 'Invalid number has two exponential');
            this.numberNode += 'e';
          } else if (c === Char.plus || c === Char.minus) {
            // @ts-expect-error seems this is an type error in Clarinet
            if (!(p === Char.e || p === Char.E)) error(this, 'Invalid symbol in number');
            this.numberNode += String.fromCharCode(c);
          } else {
            closeNumber(this);
            i--; // go back one
            this.state = this.stack.pop() || STATE.VALUE;
          }
          continue;

        default:
          error(this, `Unknown state: ${this.state}`);
      }
    }
    if (this.position >= this.bufferCheckPosition) {
      checkBufferLength(this);
    }

    emit(this, 'onchunkparsed');

    return this;
  }
}

function emit(parser: ClarinetParser, event: string, data?): void {
  // if (DEBUG) {
  //   console.log('-- emit', event, data);
  // }
  parser[event](data, parser);
}

function emitNode(parser: ClarinetParser, event: string, data?): void {
  closeValue(parser);
  emit(parser, event, data);
}

function closeValue(parser: ClarinetParser, event?: string): void {
  if (parser.textNode) {
    emit(parser, event ? event : 'onvalue', parser.textNode);
  }
  parser.textNode = undefined;
}

function closeNumber(parser: ClarinetParser): void {
  if (parser.numberNode) emit(parser, 'onvalue', parseFloat(parser.numberNode));
  parser.numberNode = '';
}

// function textopts(opt: {trim?: boolean; normalize?: boolean}, text?): string {
//   if (text === undefined) {
//     return text;
//   }
//   if (opt.trim) text = text.trim();
//   if (opt.normalize) text = text.replace(/\s+/g, ' ');
//   return text;
// }

function error(parser: ClarinetParser, message: string): ClarinetParser {
  closeValue(parser);
  message += `\nLine: ${parser.line}\nColumn: ${parser.column}\nChar: ${parser.c}`;
  const error = new Error(message);
  parser.error = error;
  emit(parser, 'onerror', error);
  return parser;
}

function isWhitespace(c) {
  return c === Char.carriageReturn || c === Char.lineFeed || c === Char.space || c === Char.tab;
}
