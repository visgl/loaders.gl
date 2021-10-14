/* eslint-disable */
// @ts-nocheck
const env = {};

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
const DEBUG = env.CDEBUG === 'debug';

const buffers = {
  textNode: undefined,
  numberNode: ''
};

let S = 0;

const STATE = {
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

for (var s_ in STATE) STATE[STATE[s_]] = s_;

// switcharoo
S = STATE;

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

  for (var buffer in buffers) {
    var len = parser[buffer] === undefined ? 0 : parser[buffer].length;
    if (len > maxAllowed) {
      switch (buffer) {
        case 'text':
          closeText(parser);
          break;

        default:
          error(parser, 'Max buffer length exceeded: ' + buffer);
      }
    }
    maxActual = Math.max(maxActual, len);
  }
  parser.bufferCheckPosition = MAX_BUFFER_LENGTH - maxActual + parser.position;
}

var stringTokenPattern = /[\\"\n]/g;

export default class ClarinetParser {
  constructor(options = {}) {
    this._initialize(options);
  }

  _initialize(options) {
    this._clearBuffers(this);
    this.bufferCheckPosition = MAX_BUFFER_LENGTH;
    this.q = '';
    this.c = '';
    this.p = '';
    this.options = options || {};
    this.closed = false;
    this.closedRoot = false;
    this.sawRoot = false;
    this.tag = null;
    this.error = null;
    this.state = S.BEGIN;
    this.stack = new Array();
    // mostly just for error reporting
    this.position = this.column = 0;
    this.line = 1;
    this.slashed = false;
    this.unicodeI = 0;
    this.unicodeS = null;
    this.depth = 0;

    // install callbacks
    if ('onready' in options) {
      this.onready = options.onready;
    }

    if ('onopenobject' in options) {
      this.onopenobject = options.onopenobject;
    }

    if ('onkey' in options) {
      this.onkey = options.onkey;
    }

    if ('oncloseobject' in options) {
      this.oncloseobject = options.oncloseobject;
    }

    if ('onopenarray' in options) {
      this.onopenarray = options.onopenarray;
    }

    if ('onclosearray' in options) {
      this.onclosearray = options.onclosearray;
    }

    if ('onvalue' in options) {
      this.onvalue = options.onvalue;
    }

    if ('onerror' in options) {
      this.onerror = options.onerror;
    }

    if ('onend' in options) {
      this.onend = options.onend;
    }

    if ('onchunkparsed' in options) {
      this.onchunkparsed = options.onchunkparsed;
    }

    emit(this, 'onready');
  }

  _clearBuffers() {
    for (var buffer in buffers) {
      this[buffer] = buffers[buffer];
    }
  }

  end() {
    if (this.state !== S.VALUE || this.depth !== 0) error(this, 'Unexpected end');

    closeValue(this);
    this.c = '';
    this.closed = true;
    emit(this, 'onend');
    this._initialize(this.options);
    return this;
  }

  resume() {
    this.error = null;
    return this;
  }

  close() {
    return this.write(null);
  }

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
    var i = 0,
      c = chunk.charCodeAt(0),
      p = this.p;
    if (DEBUG) console.log('write -> [' + chunk + ']');
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

      if (DEBUG) console.log(i, c, STATE[this.state]);
      this.position++;
      if (c === Char.lineFeed) {
        this.line++;
        this.column = 0;
      } else this.column++;

      switch (this.state) {
        case S.BEGIN:
          if (c === Char.openBrace) this.state = S.OPEN_OBJECT;
          else if (c === Char.openBracket) this.state = S.OPEN_ARRAY;
          else if (!isWhitespace(c)) {
            error(this, 'Non-whitespace before {[.');
          }
          continue;

        case S.OPEN_KEY:
        case S.OPEN_OBJECT:
          if (isWhitespace(c)) continue;
          if (this.state === S.OPEN_KEY) this.stack.push(S.CLOSE_KEY);
          else {
            if (c === Char.closeBrace) {
              emit(this, 'onopenobject');
              this.depth++;
              emit(this, 'oncloseobject');
              this.depth--;
              this.state = this.stack.pop() || S.VALUE;
              continue;
            } else this.stack.push(S.CLOSE_OBJECT);
          }
          if (c === Char.doubleQuote) this.state = S.STRING;
          else error(this, 'Malformed object key should start with "');
          continue;

        case S.CLOSE_KEY:
        case S.CLOSE_OBJECT:
          if (isWhitespace(c)) continue;
          var event = this.state === S.CLOSE_KEY ? 'key' : 'object';
          if (c === Char.colon) {
            if (this.state === S.CLOSE_OBJECT) {
              this.stack.push(S.CLOSE_OBJECT);
              closeValue(this, 'onopenobject');
              this.depth++;
            } else closeValue(this, 'onkey');
            this.state = S.VALUE;
          } else if (c === Char.closeBrace) {
            emitNode(this, 'oncloseobject');
            this.depth--;
            this.state = this.stack.pop() || S.VALUE;
          } else if (c === Char.comma) {
            if (this.state === S.CLOSE_OBJECT) this.stack.push(S.CLOSE_OBJECT);
            closeValue(this);
            this.state = S.OPEN_KEY;
          } else error(this, 'Bad object');
          continue;

        case S.OPEN_ARRAY: // after an array there always a value
        case S.VALUE:
          if (isWhitespace(c)) continue;
          if (this.state === S.OPEN_ARRAY) {
            emit(this, 'onopenarray');
            this.depth++;
            this.state = S.VALUE;
            if (c === Char.closeBracket) {
              emit(this, 'onclosearray');
              this.depth--;
              this.state = this.stack.pop() || S.VALUE;
              continue;
            } else {
              this.stack.push(S.CLOSE_ARRAY);
            }
          }
          if (c === Char.doubleQuote) this.state = S.STRING;
          else if (c === Char.openBrace) this.state = S.OPEN_OBJECT;
          else if (c === Char.openBracket) this.state = S.OPEN_ARRAY;
          else if (c === Char.t) this.state = S.TRUE;
          else if (c === Char.f) this.state = S.FALSE;
          else if (c === Char.n) this.state = S.NULL;
          else if (c === Char.minus) {
            // keep and continue
            this.numberNode += '-';
          } else if (Char._0 <= c && c <= Char._9) {
            this.numberNode += String.fromCharCode(c);
            this.state = S.NUMBER_DIGIT;
          } else error(this, 'Bad value');
          continue;

        case S.CLOSE_ARRAY:
          if (c === Char.comma) {
            this.stack.push(S.CLOSE_ARRAY);
            closeValue(this, 'onvalue');
            this.state = S.VALUE;
          } else if (c === Char.closeBracket) {
            emitNode(this, 'onclosearray');
            this.depth--;
            this.state = this.stack.pop() || S.VALUE;
          } else if (isWhitespace(c)) continue;
          else error(this, 'Bad array');
          continue;

        case S.STRING:
          if (this.textNode === undefined) {
            this.textNode = '';
          }

          // thanks thejh, this is an about 50% performance improvement.
          var starti = i - 1,
            slashed = this.slashed,
            unicodeI = this.unicodeI;
          STRING_BIGLOOP: while (true) {
            if (DEBUG) console.log(i, c, STATE[this.state], slashed);
            // zero means "no unicode active". 1-4 mean "parse some more". end after 4.
            while (unicodeI > 0) {
              this.unicodeS += String.fromCharCode(c);
              c = chunk.charCodeAt(i++);
              this.position++;
              if (unicodeI === 4) {
                // TODO this might be slow? well, probably not used too often anyway
                this.textNode += String.fromCharCode(parseInt(this.unicodeS, 16));
                unicodeI = 0;
                starti = i - 1;
              } else {
                unicodeI++;
              }
              // we can just break here: no stuff we skipped that still has to be sliced out or so
              if (!c) break STRING_BIGLOOP;
            }
            if (c === Char.doubleQuote && !slashed) {
              this.state = this.stack.pop() || S.VALUE;
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
            var reResult = stringTokenPattern.exec(chunk);
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

        case S.TRUE:
          if (c === Char.r) this.state = S.TRUE2;
          else error(this, 'Invalid true started with t' + c);
          continue;

        case S.TRUE2:
          if (c === Char.u) this.state = S.TRUE3;
          else error(this, 'Invalid true started with tr' + c);
          continue;

        case S.TRUE3:
          if (c === Char.e) {
            emit(this, 'onvalue', true);
            this.state = this.stack.pop() || S.VALUE;
          } else error(this, 'Invalid true started with tru' + c);
          continue;

        case S.FALSE:
          if (c === Char.a) this.state = S.FALSE2;
          else error(this, 'Invalid false started with f' + c);
          continue;

        case S.FALSE2:
          if (c === Char.l) this.state = S.FALSE3;
          else error(this, 'Invalid false started with fa' + c);
          continue;

        case S.FALSE3:
          if (c === Char.s) this.state = S.FALSE4;
          else error(this, 'Invalid false started with fal' + c);
          continue;

        case S.FALSE4:
          if (c === Char.e) {
            emit(this, 'onvalue', false);
            this.state = this.stack.pop() || S.VALUE;
          } else error(this, 'Invalid false started with fals' + c);
          continue;

        case S.NULL:
          if (c === Char.u) this.state = S.NULL2;
          else error(this, 'Invalid null started with n' + c);
          continue;

        case S.NULL2:
          if (c === Char.l) this.state = S.NULL3;
          else error(this, 'Invalid null started with nu' + c);
          continue;

        case S.NULL3:
          if (c === Char.l) {
            emit(this, 'onvalue', null);
            this.state = this.stack.pop() || S.VALUE;
          } else error(this, 'Invalid null started with nul' + c);
          continue;

        case S.NUMBER_DECIMAL_POINT:
          if (c === Char.period) {
            this.numberNode += '.';
            this.state = S.NUMBER_DIGIT;
          } else error(this, 'Leading zero not followed by .');
          continue;

        case S.NUMBER_DIGIT:
          if (Char._0 <= c && c <= Char._9) this.numberNode += String.fromCharCode(c);
          else if (c === Char.period) {
            if (this.numberNode.indexOf('.') !== -1) error(this, 'Invalid number has two dots');
            this.numberNode += '.';
          } else if (c === Char.e || c === Char.E) {
            if (this.numberNode.indexOf('e') !== -1 || this.numberNode.indexOf('E') !== -1)
              error(this, 'Invalid number has two exponential');
            this.numberNode += 'e';
          } else if (c === Char.plus || c === Char.minus) {
            if (!(p === Char.e || p === Char.E)) error(this, 'Invalid symbol in number');
            this.numberNode += String.fromCharCode(c);
          } else {
            closeNumber(this);
            i--; // go back one
            this.state = this.stack.pop() || S.VALUE;
          }
          continue;

        default:
          error(this, 'Unknown state: ' + this.state);
      }
    }
    if (this.position >= this.bufferCheckPosition) {
      checkBufferLength(this);
    }

    emit(this, 'onchunkparsed');

    return this;
  }
}

function emit(parser, event, data) {
  if (DEBUG) {
    console.log('-- emit', event, data);
  }
  if (parser[event]) {
    parser[event](data, parser);
  }
}

function emitNode(parser, event, data) {
  closeValue(parser);
  emit(parser, event, data);
}

function closeValue(parser, event) {
  parser.textNode = textopts(parser.options, parser.textNode);
  if (parser.textNode !== undefined) {
    emit(parser, event ? event : 'onvalue', parser.textNode);
  }
  parser.textNode = undefined;
}

function closeNumber(parser) {
  if (parser.numberNode) emit(parser, 'onvalue', parseFloat(parser.numberNode));
  parser.numberNode = '';
}

function textopts(opt, text) {
  if (text === undefined) {
    return text;
  }
  if (opt.trim) text = text.trim();
  if (opt.normalize) text = text.replace(/\s+/g, ' ');
  return text;
}

function error(parser, er) {
  closeValue(parser);
  er += '\nLine: ' + parser.line + '\nColumn: ' + parser.column + '\nChar: ' + parser.c;
  er = new Error(er);
  parser.error = er;
  emit(parser, 'onerror', er);
  return parser;
}

function isWhitespace(c) {
  return c === Char.carriageReturn || c === Char.lineFeed || c === Char.space || c === Char.tab;
}
