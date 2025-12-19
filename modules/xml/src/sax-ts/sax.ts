// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is forked from https://github.com/Maxim-Mazurok/sax-ts under ISC license,
// which in turn is forked from https://github.com/isaacs/sax-js under ISC license

// Copyright (c) Isaac Z. Schlueter and Contributors
// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

/* eslint-disable */

export type SAXEventName =
  | 'text'
  | 'processinginstruction'
  | 'sgmldeclaration'
  | 'doctype'
  | 'comment'
  | 'opentagstart'
  | 'attribute'
  | 'opentag'
  | 'closetag'
  | 'opencdata'
  | 'cdata'
  | 'closecdata'
  | 'error'
  | 'end'
  | 'ready'
  | 'script'
  | 'opennamespace'
  | 'closenamespace';

export type SAXEventCallback = (data: any, eventName: SAXEventName, SAXParser) => void;

export type SAXEvents = {
  ontext?: SAXEventCallback;
  onprocessinginstruction?: SAXEventCallback;
  onsgmldeclaration?: SAXEventCallback;
  ondoctype?: SAXEventCallback;
  oncomment?: SAXEventCallback;
  onopentagstart?: SAXEventCallback;
  onattribute?: SAXEventCallback;
  onopentag?: SAXEventCallback;
  onclosetag?: SAXEventCallback;
  onopencdata?: SAXEventCallback;
  oncdata?: SAXEventCallback;
  onclosecdata?: SAXEventCallback;
  onerror?: SAXEventCallback;
  onend?: SAXEventCallback;
  onready?: SAXEventCallback;
  onscript?: SAXEventCallback;
  onopennamespace?: SAXEventCallback;
  onclosenamespace?: SAXEventCallback;
};

export type SAXParserOptions = SAXEvents & {
  strict?: boolean;
  MAX_BUFFER_LENGTH?: number;
  lowercase?: boolean;
  lowercasetags?: boolean;
  noscript?: boolean;
  strictEntities?: boolean;
  xmlns?: any;
  position?: any;
  trim?: any;
  normalize?: any;
};

const DEFAULT_SAX_EVENTS: Required<SAXEvents> = {
  ontext: () => {},
  onprocessinginstruction: () => {},
  onsgmldeclaration: () => {},
  ondoctype: () => {},
  oncomment: () => {},
  onopentagstart: () => {},
  onattribute: () => {},
  onopentag: () => {},
  onclosetag: () => {},
  onopencdata: () => {},
  oncdata: () => {},
  onclosecdata: () => {},
  onerror: () => {},
  onend: () => {},
  onready: () => {},
  onscript: () => {},
  onopennamespace: () => {},
  onclosenamespace: () => {}
};

const DEFAULT_SAX_PARSER_OPTIONS: Required<SAXParserOptions> = {
  ...DEFAULT_SAX_EVENTS,
  strict: false,
  MAX_BUFFER_LENGTH: 64 * 1024,
  lowercase: false,
  lowercasetags: false,
  noscript: false,
  strictEntities: false,
  xmlns: undefined,
  position: undefined,
  trim: undefined,
  normalize: undefined
};

const EVENTS = [
  'text',
  'processinginstruction',
  'sgmldeclaration',
  'doctype',
  'comment',
  'opentagstart',
  'attribute',
  'opentag',
  'closetag',
  'opencdata',
  'cdata',
  'closecdata',
  'error',
  'end',
  'ready',
  'script',
  'opennamespace',
  'closenamespace'
];

const BUFFERS = [
  'comment',
  'sgmlDecl',
  'textNode',
  'tagName',
  'doctype',
  'procInstName',
  'procInstBody',
  'entity',
  'attribName',
  'attribValue',
  'cdata',
  'script'
];

const nameStart =
  /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
const nameBody =
  /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
const entityStart =
  /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
const entityBody =
  /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

export const ENTITIES: {[key: string]: number | string} = {
  amp: '&',
  gt: '>',
  lt: '<',
  quot: '"',
  apos: "'",
  AElig: 198,
  Aacute: 193,
  Acirc: 194,
  Agrave: 192,
  Aring: 197,
  Atilde: 195,
  Auml: 196,
  Ccedil: 199,
  ETH: 208,
  Eacute: 201,
  Ecirc: 202,
  Egrave: 200,
  Euml: 203,
  Iacute: 205,
  Icirc: 206,
  Igrave: 204,
  Iuml: 207,
  Ntilde: 209,
  Oacute: 211,
  Ocirc: 212,
  Ograve: 210,
  Oslash: 216,
  Otilde: 213,
  Ouml: 214,
  THORN: 222,
  Uacute: 218,
  Ucirc: 219,
  Ugrave: 217,
  Uuml: 220,
  Yacute: 221,
  aacute: 225,
  acirc: 226,
  aelig: 230,
  agrave: 224,
  aring: 229,
  atilde: 227,
  auml: 228,
  ccedil: 231,
  eacute: 233,
  ecirc: 234,
  egrave: 232,
  eth: 240,
  euml: 235,
  iacute: 237,
  icirc: 238,
  igrave: 236,
  iuml: 239,
  ntilde: 241,
  oacute: 243,
  ocirc: 244,
  ograve: 242,
  oslash: 248,
  otilde: 245,
  ouml: 246,
  szlig: 223,
  thorn: 254,
  uacute: 250,
  ucirc: 251,
  ugrave: 249,
  uuml: 252,
  yacute: 253,
  yuml: 255,
  copy: 169,
  reg: 174,
  nbsp: 160,
  iexcl: 161,
  cent: 162,
  pound: 163,
  curren: 164,
  yen: 165,
  brvbar: 166,
  sect: 167,
  uml: 168,
  ordf: 170,
  laquo: 171,
  not: 172,
  shy: 173,
  macr: 175,
  deg: 176,
  plusmn: 177,
  sup1: 185,
  sup2: 178,
  sup3: 179,
  acute: 180,
  micro: 181,
  para: 182,
  middot: 183,
  cedil: 184,
  ordm: 186,
  raquo: 187,
  frac14: 188,
  frac12: 189,
  frac34: 190,
  iquest: 191,
  times: 215,
  divide: 247,
  OElig: 338,
  oelig: 339,
  Scaron: 352,
  scaron: 353,
  Yuml: 376,
  fnof: 402,
  circ: 710,
  tilde: 732,
  Alpha: 913,
  Beta: 914,
  Gamma: 915,
  Delta: 916,
  Epsilon: 917,
  Zeta: 918,
  Eta: 919,
  Theta: 920,
  Iota: 921,
  Kappa: 922,
  Lambda: 923,
  Mu: 924,
  Nu: 925,
  Xi: 926,
  Omicron: 927,
  Pi: 928,
  Rho: 929,
  Sigma: 931,
  Tau: 932,
  Upsilon: 933,
  Phi: 934,
  Chi: 935,
  Psi: 936,
  Omega: 937,
  alpha: 945,
  beta: 946,
  gamma: 947,
  delta: 948,
  epsilon: 949,
  zeta: 950,
  eta: 951,
  theta: 952,
  iota: 953,
  kappa: 954,
  lambda: 955,
  mu: 956,
  nu: 957,
  xi: 958,
  omicron: 959,
  pi: 960,
  rho: 961,
  sigmaf: 962,
  sigma: 963,
  tau: 964,
  upsilon: 965,
  phi: 966,
  chi: 967,
  psi: 968,
  omega: 969,
  thetasym: 977,
  upsih: 978,
  piv: 982,
  ensp: 8194,
  emsp: 8195,
  thinsp: 8201,
  zwnj: 8204,
  zwj: 8205,
  lrm: 8206,
  rlm: 8207,
  ndash: 8211,
  mdash: 8212,
  lsquo: 8216,
  rsquo: 8217,
  sbquo: 8218,
  ldquo: 8220,
  rdquo: 8221,
  bdquo: 8222,
  dagger: 8224,
  Dagger: 8225,
  bull: 8226,
  hellip: 8230,
  permil: 8240,
  prime: 8242,
  Prime: 8243,
  lsaquo: 8249,
  rsaquo: 8250,
  oline: 8254,
  frasl: 8260,
  euro: 8364,
  image: 8465,
  weierp: 8472,
  real: 8476,
  trade: 8482,
  alefsym: 8501,
  larr: 8592,
  uarr: 8593,
  rarr: 8594,
  darr: 8595,
  harr: 8596,
  crarr: 8629,
  lArr: 8656,
  uArr: 8657,
  rArr: 8658,
  dArr: 8659,
  hArr: 8660,
  forall: 8704,
  part: 8706,
  exist: 8707,
  empty: 8709,
  nabla: 8711,
  isin: 8712,
  notin: 8713,
  ni: 8715,
  prod: 8719,
  sum: 8721,
  minus: 8722,
  lowast: 8727,
  radic: 8730,
  prop: 8733,
  infin: 8734,
  ang: 8736,
  and: 8743,
  or: 8744,
  cap: 8745,
  cup: 8746,
  int: 8747,
  there4: 8756,
  sim: 8764,
  cong: 8773,
  asymp: 8776,
  ne: 8800,
  equiv: 8801,
  le: 8804,
  ge: 8805,
  sub: 8834,
  sup: 8835,
  nsub: 8836,
  sube: 8838,
  supe: 8839,
  oplus: 8853,
  otimes: 8855,
  perp: 8869,
  sdot: 8901,
  lceil: 8968,
  rceil: 8969,
  lfloor: 8970,
  rfloor: 8971,
  lang: 9001,
  rang: 9002,
  loz: 9674,
  spades: 9824,
  clubs: 9827,
  hearts: 9829,
  diams: 9830
};

Object.keys(ENTITIES).forEach((key) => {
  const e = ENTITIES[key];
  ENTITIES[key] = typeof e === 'number' ? String.fromCharCode(e) : e;
});

/**
 * Internal helper class
 */
abstract class SAX {
  EVENTS: string[] = EVENTS;
  ENTITIES: {[key: string]: number | string} = {
    // TODO: make it readonly, needed for entity-mega test
    // amp, gt, lt, quot and apos are resolved to strings instead of numerical
    // codes, IDK why
    ...ENTITIES
  };

  protected abstract events: SAXEvents;

  protected XML_ENTITIES: {[key: string]: string} = {
    amp: '&',
    gt: '>',
    lt: '<',
    quot: '"',
    apos: "'"
  };
  protected S: any = 0;
  protected opt: any;
  protected trackPosition = false;
  protected column = 0;
  protected line = 0;
  protected c = '';
  protected error: any;
  protected q = '';
  protected bufferCheckPosition: any;
  protected closed = false;
  protected tags: any[] = [];
  protected looseCase = '';
  protected closedRoot = false;
  protected sawRoot = false;
  protected strict = false;
  protected tag: any;
  protected strictEntities: any;
  protected state: any;
  protected noscript = false;
  protected attribList: any[] = [];
  protected ns: any;
  protected position = 0;

  private STATE: {[index: string]: any} = {
    BEGIN: this.S++, // leading byte order mark or whitespace
    BEGIN_WHITESPACE: this.S++, // leading whitespace
    TEXT: this.S++, // general stuff
    TEXT_ENTITY: this.S++, // &amp and such.
    OPEN_WAKA: this.S++, // <
    SGML_DECL: this.S++, // <!BLARG
    SGML_DECL_QUOTED: this.S++, // <!BLARG foo "bar
    DOCTYPE: this.S++, // <!DOCTYPE
    DOCTYPE_QUOTED: this.S++, // <!DOCTYPE "//blah
    DOCTYPE_DTD: this.S++, // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: this.S++, // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: this.S++, // <!-
    COMMENT: this.S++, // <!--
    COMMENT_ENDING: this.S++, // <!-- blah -
    COMMENT_ENDED: this.S++, // <!-- blah --
    CDATA: this.S++, // <![CDATA[ something
    CDATA_ENDING: this.S++, // ]
    CDATA_ENDING_2: this.S++, // ]]
    PROC_INST: this.S++, // <?hi
    PROC_INST_BODY: this.S++, // <?hi there
    PROC_INST_ENDING: this.S++, // <?hi "there" ?
    OPEN_TAG: this.S++, // <strong
    OPEN_TAG_SLASH: this.S++, // <strong /
    ATTRIB: this.S++, // <a
    ATTRIB_NAME: this.S++, // <a foo
    ATTRIB_NAME_SAW_WHITE: this.S++, // <a foo _
    ATTRIB_VALUE: this.S++, // <a foo=
    ATTRIB_VALUE_QUOTED: this.S++, // <a foo="bar
    ATTRIB_VALUE_CLOSED: this.S++, // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: this.S++, // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: this.S++, // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: this.S++, // <foo bar=&quot
    CLOSE_TAG: this.S++, // </a
    CLOSE_TAG_SAW_WHITE: this.S++, // </a   >
    SCRIPT: this.S++, // <script> ...
    SCRIPT_ENDING: this.S++ // <script> ... <
  };

  private readonly BUFFERS: string[] = BUFFERS;
  // private parser: (strict: boolean, opt: any) => SAXParser;
  private CDATA = '[CDATA[';
  private DOCTYPE = 'DOCTYPE';
  private XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
  private XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
  protected rootNS: {} = {
    xml: this.XML_NAMESPACE,
    xmlns: this.XMLNS_NAMESPACE
  };
  private comment: any;
  private sgmlDecl: any;
  private textNode = '';
  private tagName: any;
  private doctype: any;
  private procInstName: any;
  private procInstBody: any;
  private entity = '';
  private attribName: any;
  private attribValue: any;
  private cdata = '';
  private script = '';
  private startTagPosition = 0;

  constructor() {
    this.S = 0;

    for (const s in this.STATE) {
      if (this.STATE.hasOwnProperty(s)) {
        this.STATE[this.STATE[s]] = s;
      }
    }

    // shorthand
    this.S = this.STATE;
  }

  private static charAt(chunk: string, i: number): string {
    let result = '';
    if (i < chunk.length) {
      result = chunk.charAt(i);
    }
    return result;
  }

  private static isWhitespace(c: string): boolean {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t';
  }

  private static isQuote(c: string): boolean {
    return c === '"' || c === "'";
  }

  private static isAttribEnd(c: string): boolean {
    return c === '>' || SAX.isWhitespace(c);
  }

  private static isMatch(regex: RegExp, c: string): boolean {
    return regex.test(c);
  }

  private static notMatch(regex: RegExp, c: string): boolean {
    return !SAX.isMatch(regex, c);
  }

  private static qname(
    name: string,
    attribute?: string | boolean
  ): {prefix: string; local: string} {
    const i = name.indexOf(':');
    const qualName = i < 0 ? ['', name] : name.split(':');
    let prefix = qualName[0];
    let local = qualName[1];

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns';
      local = '';
    }

    return {prefix, local};
  }

  write(chunk: null | object | string): this | SAXParser {
    if (this.error) {
      throw this.error;
    }
    if (this.closed) {
      return this.errorFunction('Cannot write after close. Assign an onready handler.');
    }
    if (chunk === null) {
      return this.end();
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString();
    }
    let i = 0;
    let c: string;
    while (true) {
      c = SAX.charAt(chunk, i++);
      this.c = c;

      if (!c) {
        break;
      }

      if (this.trackPosition) {
        this.position++;
        if (c === '\n') {
          this.line++;
          this.column = 0;
        } else {
          this.column++;
        }
      }

      switch (this.state) {
        case this.S.BEGIN:
          this.state = this.S.BEGIN_WHITESPACE;
          if (c === '\uFEFF') {
            continue;
          }
          this.beginWhiteSpace(c);
          continue;

        case this.S.BEGIN_WHITESPACE:
          this.beginWhiteSpace(c);
          continue;

        case this.S.TEXT:
          if (this.sawRoot && !this.closedRoot) {
            const starti = i - 1;
            while (c && c !== '<' && c !== '&') {
              c = SAX.charAt(chunk, i++);
              if (c && this.trackPosition) {
                this.position++;
                if (c === '\n') {
                  this.line++;
                  this.column = 0;
                } else {
                  this.column++;
                }
              }
            }
            this.textNode += chunk.substring(starti, i - 1);
          }
          if (c === '<' && !(this.sawRoot && this.closedRoot && !this.strict)) {
            this.state = this.S.OPEN_WAKA;
            this.startTagPosition = this.position;
          } else {
            if (!SAX.isWhitespace(c) && (!this.sawRoot || this.closedRoot)) {
              this.strictFail('Text data outside of root node.');
            }
            if (c === '&') {
              this.state = this.S.TEXT_ENTITY;
            } else {
              this.textNode += c;
            }
          }
          continue;

        case this.S.SCRIPT:
          // only non-strict
          if (c === '<') {
            this.state = this.S.SCRIPT_ENDING;
          } else {
            this.script += c;
          }
          continue;

        case this.S.SCRIPT_ENDING:
          if (c === '/') {
            this.state = this.S.CLOSE_TAG;
          } else {
            this.script += `<${c}`;
            this.state = this.S.SCRIPT;
          }
          continue;

        case this.S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            this.state = this.S.SGML_DECL;
            this.sgmlDecl = '';
          } else if (SAX.isWhitespace(c)) {
            // wait for it...
          } else if (SAX.isMatch(nameStart, c)) {
            this.state = this.S.OPEN_TAG;
            this.tagName = c;
          } else if (c === '/') {
            this.state = this.S.CLOSE_TAG;
            this.tagName = '';
          } else if (c === '?') {
            this.state = this.S.PROC_INST;
            this.procInstName = this.procInstBody = '';
          } else {
            this.strictFail('Unencoded <');
            // if there was some whitespace, then add that in.
            if (this.startTagPosition + 1 < this.position) {
              const pad = this.position - this.startTagPosition;
              c = new Array(pad).join(' ') + c;
            }
            this.textNode += `<${c}`;
            this.state = this.S.TEXT;
          }
          continue;

        case this.S.SGML_DECL:
          if ((this.sgmlDecl + c).toUpperCase() === this.CDATA) {
            this.emitNode('onopencdata');
            this.state = this.S.CDATA;
            this.sgmlDecl = '';
            this.cdata = '';
          } else if (this.sgmlDecl + c === '--') {
            this.state = this.S.COMMENT;
            this.comment = '';
            this.sgmlDecl = '';
          } else if ((this.sgmlDecl + c).toUpperCase() === this.DOCTYPE) {
            this.state = this.S.DOCTYPE;
            if (this.doctype || this.sawRoot) {
              this.strictFail('Inappropriately located doctype declaration');
            }
            this.doctype = '';
            this.sgmlDecl = '';
          } else if (c === '>') {
            this.emitNode('onsgmldeclaration', this.sgmlDecl);
            this.sgmlDecl = '';
            this.state = this.S.TEXT;
          } else if (SAX.isQuote(c)) {
            this.state = this.S.SGML_DECL_QUOTED;
            this.sgmlDecl += c;
          } else {
            this.sgmlDecl += c;
          }
          continue;

        case this.S.SGML_DECL_QUOTED:
          if (c === this.q) {
            this.state = this.S.SGML_DECL;
            this.q = '';
          }
          this.sgmlDecl += c;
          continue;

        case this.S.DOCTYPE:
          if (c === '>') {
            this.state = this.S.TEXT;
            this.emitNode('ondoctype', this.doctype);
            this.doctype = true; // just remember that we saw it.
          } else {
            this.doctype += c;
            if (c === '[') {
              this.state = this.S.DOCTYPE_DTD;
            } else if (SAX.isQuote(c)) {
              this.state = this.S.DOCTYPE_QUOTED;
              this.q = c;
            }
          }
          continue;

        case this.S.DOCTYPE_QUOTED:
          this.doctype += c;
          if (c === this.q) {
            this.q = '';
            this.state = this.S.DOCTYPE;
          }
          continue;

        case this.S.DOCTYPE_DTD:
          this.doctype += c;
          if (c === ']') {
            this.state = this.S.DOCTYPE;
          } else if (SAX.isQuote(c)) {
            this.state = this.S.DOCTYPE_DTD_QUOTED;
            this.q = c;
          }
          continue;

        case this.S.DOCTYPE_DTD_QUOTED:
          this.doctype += c;
          if (c === this.q) {
            this.state = this.S.DOCTYPE_DTD;
            this.q = '';
          }
          continue;

        case this.S.COMMENT:
          if (c === '-') {
            this.state = this.S.COMMENT_ENDING;
          } else {
            this.comment += c;
          }
          continue;

        case this.S.COMMENT_ENDING:
          if (c === '-') {
            this.state = this.S.COMMENT_ENDED;
            this.comment = this.textApplyOptions(this.comment);
            if (this.comment) {
              this.emitNode('oncomment', this.comment);
            }
            this.comment = '';
          } else {
            this.comment += `-${c}`;
            this.state = this.S.COMMENT;
          }
          continue;

        case this.S.COMMENT_ENDED:
          if (c !== '>') {
            this.strictFail('Malformed comment');
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            this.comment += `--${c}`;
            this.state = this.S.COMMENT;
          } else {
            this.state = this.S.TEXT;
          }
          continue;

        case this.S.CDATA:
          if (c === ']') {
            this.state = this.S.CDATA_ENDING;
          } else {
            this.cdata += c;
          }
          continue;

        case this.S.CDATA_ENDING:
          if (c === ']') {
            this.state = this.S.CDATA_ENDING_2;
          } else {
            this.cdata += `]${c}`;
            this.state = this.S.CDATA;
          }
          continue;

        case this.S.CDATA_ENDING_2:
          if (c === '>') {
            if (this.cdata) {
              this.emitNode('oncdata', this.cdata);
            }
            this.emitNode('onclosecdata');
            this.cdata = '';
            this.state = this.S.TEXT;
          } else if (c === ']') {
            this.cdata += ']';
          } else {
            this.cdata += `]]${c}`;
            this.state = this.S.CDATA;
          }
          continue;

        case this.S.PROC_INST:
          if (c === '?') {
            this.state = this.S.PROC_INST_ENDING;
          } else if (SAX.isWhitespace(c)) {
            this.state = this.S.PROC_INST_BODY;
          } else {
            this.procInstName += c;
          }
          continue;

        case this.S.PROC_INST_BODY:
          if (!this.procInstBody && SAX.isWhitespace(c)) {
            continue;
          } else if (c === '?') {
            this.state = this.S.PROC_INST_ENDING;
          } else {
            this.procInstBody += c;
          }
          continue;

        case this.S.PROC_INST_ENDING:
          if (c === '>') {
            this.emitNode('onprocessinginstruction', {
              name: this.procInstName,
              body: this.procInstBody
            });
            this.procInstName = this.procInstBody = '';
            this.state = this.S.TEXT;
          } else {
            this.procInstBody += `?${c}`;
            this.state = this.S.PROC_INST_BODY;
          }
          continue;

        case this.S.OPEN_TAG:
          if (SAX.isMatch(nameBody, c)) {
            this.tagName += c;
          } else {
            this.newTag();
            if (c === '>') {
              this.openTag();
            } else if (c === '/') {
              this.state = this.S.OPEN_TAG_SLASH;
            } else {
              if (!SAX.isWhitespace(c)) {
                this.strictFail('Invalid character in tag name');
              }
              this.state = this.S.ATTRIB;
            }
          }
          continue;

        case this.S.OPEN_TAG_SLASH:
          if (c === '>') {
            this.openTag(true);
            this.closeTag();
          } else {
            this.strictFail('Forward-slash in opening tag not followed by >');
            this.state = this.S.ATTRIB;
          }
          continue;

        case this.S.ATTRIB:
          // haven't read the attribute name yet.
          if (SAX.isWhitespace(c)) {
            continue;
          } else if (c === '>') {
            this.openTag();
          } else if (c === '/') {
            this.state = this.S.OPEN_TAG_SLASH;
          } else if (SAX.isMatch(nameStart, c)) {
            this.attribName = c;
            this.attribValue = '';
            this.state = this.S.ATTRIB_NAME;
          } else {
            this.strictFail('Invalid attribute name');
          }
          continue;

        case this.S.ATTRIB_NAME:
          if (c === '=') {
            this.state = this.S.ATTRIB_VALUE;
          } else if (c === '>') {
            this.strictFail('Attribute without value');
            this.attribValue = this.attribName;
            this.attrib();
            this.openTag();
          } else if (SAX.isWhitespace(c)) {
            this.state = this.S.ATTRIB_NAME_SAW_WHITE;
          } else if (SAX.isMatch(nameBody, c)) {
            this.attribName += c;
          } else {
            this.strictFail('Invalid attribute name');
          }
          continue;

        case this.S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            this.state = this.S.ATTRIB_VALUE;
          } else if (SAX.isWhitespace(c)) {
            continue;
          } else {
            this.strictFail('Attribute without value');
            this.tag.attributes[this.attribName] = '';
            this.attribValue = '';
            this.emitNode('onattribute', {
              name: this.attribName,
              value: ''
            });
            this.attribName = '';
            if (c === '>') {
              this.openTag();
            } else if (SAX.isMatch(nameStart, c)) {
              this.attribName = c;
              this.state = this.S.ATTRIB_NAME;
            } else {
              this.strictFail('Invalid attribute name');
              this.state = this.S.ATTRIB;
            }
          }
          continue;

        case this.S.ATTRIB_VALUE:
          if (SAX.isWhitespace(c)) {
            continue;
          } else if (SAX.isQuote(c)) {
            this.q = c;
            this.state = this.S.ATTRIB_VALUE_QUOTED;
          } else {
            this.strictFail('Unquoted attribute value');
            this.state = this.S.ATTRIB_VALUE_UNQUOTED;
            this.attribValue = c;
          }
          continue;

        case this.S.ATTRIB_VALUE_QUOTED:
          if (c !== this.q) {
            if (c === '&') {
              this.state = this.S.ATTRIB_VALUE_ENTITY_Q;
            } else {
              this.attribValue += c;
            }
            continue;
          }
          this.attrib();
          this.q = '';
          this.state = this.S.ATTRIB_VALUE_CLOSED;
          continue;

        case this.S.ATTRIB_VALUE_CLOSED:
          if (SAX.isWhitespace(c)) {
            this.state = this.S.ATTRIB;
          } else if (c === '>') {
            this.openTag();
          } else if (c === '/') {
            this.state = this.S.OPEN_TAG_SLASH;
          } else if (SAX.isMatch(nameStart, c)) {
            this.strictFail('No whitespace between attributes');
            this.attribName = c;
            this.attribValue = '';
            this.state = this.S.ATTRIB_NAME;
          } else {
            this.strictFail('Invalid attribute name');
          }
          continue;

        case this.S.ATTRIB_VALUE_UNQUOTED:
          if (!SAX.isAttribEnd(c)) {
            if (c === '&') {
              this.state = this.S.ATTRIB_VALUE_ENTITY_U;
            } else {
              this.attribValue += c;
            }
            continue;
          }
          this.attrib();
          if (c === '>') {
            this.openTag();
          } else {
            this.state = this.S.ATTRIB;
          }
          continue;

        case this.S.CLOSE_TAG:
          if (!this.tagName) {
            if (SAX.isWhitespace(c)) {
              continue;
            } else if (SAX.notMatch(nameStart, c)) {
              if (this.script) {
                this.script += `</${c}`;
                this.state = this.S.SCRIPT;
              } else {
                this.strictFail('Invalid tagname in closing tag.');
              }
            } else {
              this.tagName = c;
            }
          } else if (c === '>') {
            this.closeTag();
          } else if (SAX.isMatch(nameBody, c)) {
            this.tagName += c;
          } else if (this.script) {
            this.script += `</${this.tagName}`;
            this.tagName = '';
            this.state = this.S.SCRIPT;
          } else {
            if (!SAX.isWhitespace(c)) {
              this.strictFail('Invalid tagname in closing tag');
            }
            this.state = this.S.CLOSE_TAG_SAW_WHITE;
          }
          continue;

        case this.S.CLOSE_TAG_SAW_WHITE:
          if (SAX.isWhitespace(c)) {
            continue;
          }
          if (c === '>') {
            this.closeTag();
          } else {
            this.strictFail('Invalid characters in closing tag');
          }
          continue;

        case this.S.TEXT_ENTITY:
        case this.S.ATTRIB_VALUE_ENTITY_Q:
        case this.S.ATTRIB_VALUE_ENTITY_U:
          let returnState;
          let buffer;
          switch (this.state) {
            case this.S.TEXT_ENTITY:
              returnState = this.S.TEXT;
              buffer = 'textNode';
              break;

            case this.S.ATTRIB_VALUE_ENTITY_Q:
              returnState = this.S.ATTRIB_VALUE_QUOTED;
              buffer = 'attribValue';
              break;

            case this.S.ATTRIB_VALUE_ENTITY_U:
              returnState = this.S.ATTRIB_VALUE_UNQUOTED;
              buffer = 'attribValue';
              break;

            default:
              throw new Error(`Unknown state: ${this.state}`);
          }

          if (c === ';') {
            this[buffer] += this.parseEntity();
            this.entity = '';
            this.state = returnState;
          } else if (SAX.isMatch(this.entity.length ? entityBody : entityStart, c)) {
            this.entity += c;
          } else {
            this.strictFail('Invalid character in entity name');
            this[buffer] += `&${this.entity}${c}`;
            this.entity = '';
            this.state = returnState;
          }

          continue;

        default:
          throw new Error(`Unknown state: ${this.state}`);
      }
    } // while

    if (this.position >= this.bufferCheckPosition) {
      this.checkBufferLength();
    }
    return this;
  }

  protected emit(event: string, data?: Error | {}): void {
    if (this.events.hasOwnProperty(event)) {
      const eventName = event.replace(/^on/, '');
      this.events[event](data, eventName, this);
    }
  }

  protected clearBuffers(): void {
    for (let i = 0, l = this.BUFFERS.length; i < l; i++) {
      this[this[i]] = '';
    }
  }

  protected flushBuffers(): void {
    this.closeText();
    if (this.cdata !== '') {
      this.emitNode('oncdata', this.cdata);
      this.cdata = '';
    }
    if (this.script !== '') {
      this.emitNode('onscript', this.script);
      this.script = '';
    }
  }

  protected end(): SAXParser {
    if (this.sawRoot && !this.closedRoot) this.strictFail('Unclosed root tag');
    if (
      this.state !== this.S.BEGIN &&
      this.state !== this.S.BEGIN_WHITESPACE &&
      this.state !== this.S.TEXT
    ) {
      this.errorFunction('Unexpected end');
    }
    this.closeText();
    this.c = '';
    this.closed = true;
    this.emit('onend');
    return new SAXParser(this.opt);
  }

  protected errorFunction(er: string): this {
    this.closeText();
    if (this.trackPosition) {
      er += `\nLine: ${this.line}\nColumn: ${this.column}\nChar: ${this.c}`;
    }
    const error = new Error(er);
    this.error = error;
    this.emit('onerror', error);
    return this;
  }

  private attrib(): void {
    if (!this.strict) {
      this.attribName = this.attribName[this.looseCase]();
    }

    if (
      this.attribList.indexOf(this.attribName) !== -1 ||
      this.tag.attributes.hasOwnProperty(this.attribName)
    ) {
      this.attribName = this.attribValue = '';
      return;
    }

    if (this.opt.xmlns) {
      const qn = SAX.qname(this.attribName, true);
      const prefix = qn.prefix;
      const local = qn.local;

      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && this.attribValue !== this.XML_NAMESPACE) {
          this.strictFail(
            `xml: prefix must be bound to ${this.XML_NAMESPACE}\n` + `Actual: ${this.attribValue}`
          );
        } else if (local === 'xmlns' && this.attribValue !== this.XMLNS_NAMESPACE) {
          this.strictFail(
            `xmlns: prefix must be bound to ${this.XMLNS_NAMESPACE}\n` +
              `Actual: ${this.attribValue}`
          );
        } else {
          const tag = this.tag;
          const parent = this.tags[this.tags.length - 1] || this;
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns);
          }
          tag.ns[local] = this.attribValue;
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      this.attribList.push([this.attribName, this.attribValue]);
    } else {
      // in non-xmlns mode, we can emit the event right away
      this.tag.attributes[this.attribName] = this.attribValue;
      this.emitNode('onattribute', {
        name: this.attribName,
        value: this.attribValue
      });
    }

    this.attribName = this.attribValue = '';
  }

  private newTag(): void {
    if (!this.strict) this.tagName = this.tagName[this.looseCase]();
    const parent = this.tags[this.tags.length - 1] || this;
    const tag: any = (this.tag = {name: this.tagName, attributes: {}});

    // will be overridden if tag contains an xmlns="foo" or xmlns:foo="bar"
    if (this.opt.xmlns) {
      tag.ns = parent.ns;
    }
    this.attribList.length = 0;
    this.emitNode('onopentagstart', tag);
  }

  private parseEntity(): string | number {
    let entity = this.entity;
    const entityLC = entity.toLowerCase();
    let num = NaN;
    let numStr = '';

    if (this.ENTITIES[entity]) {
      return this.ENTITIES[entity];
    }
    if (this.ENTITIES[entityLC]) {
      return this.ENTITIES[entityLC];
    }
    entity = entityLC;
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2);
        // TODO: remove tslint:disable
        // tslint:disable-next-line
        num = parseInt(entity, 16);
        numStr = num.toString(16);
      } else {
        entity = entity.slice(1);
        // TODO: remove tslint:disable
        // tslint:disable-next-line
        num = parseInt(entity, 10);
        numStr = num.toString(10);
      }
    }

    entity = entity.replace(/^0+/, '');
    if (isNaN(num) || numStr.toLowerCase() !== entity) {
      this.strictFail('Invalid character entity');
      return `&${this.entity};`;
    }

    return String.fromCodePoint(num);
  }

  private beginWhiteSpace(c: string): void {
    if (c === '<') {
      this.state = this.S.OPEN_WAKA;
      this.startTagPosition = this.position;
    } else if (!SAX.isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      this.strictFail('Non-whitespace before first tag.');
      this.textNode = c;
      this.state = this.S.TEXT;
    } else {
    }
  }

  private strictFail(message: string): void {
    if (typeof this !== 'object' || !(this instanceof SAXParser)) {
      throw new Error('bad call to strictFail');
    }
    if (this.strict) {
      this.errorFunction(message);
    }
  }

  private textApplyOptions(text: string): string {
    if (this.opt.trim) text = text.trim();
    if (this.opt.normalize) text = text.replace(/\s+/g, ' ');
    return text;
  }

  private emitNode(nodeType: string, data?: {}): void {
    if (this.textNode) this.closeText();
    this.emit(nodeType, data);
  }

  private closeText(): void {
    this.textNode = this.textApplyOptions(this.textNode);
    // TODO: figure out why this.textNode can be "" and "undefined"
    if (this.textNode !== undefined && this.textNode !== '' && this.textNode !== 'undefined') {
      this.emit('ontext', this.textNode);
    }
    this.textNode = '';
  }

  private checkBufferLength(): void {
    const maxAllowed = Math.max(this.opt.MAX_BUFFER_LENGTH, 10);
    let maxActual = 0;
    for (let i = 0, l = this.BUFFERS.length; i < l; i++) {
      const len = this[this.BUFFERS[i]]?.length || 0;
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (this.BUFFERS[i]) {
          case 'textNode':
            this.closeText();
            break;
          case 'cdata':
            this.emitNode('oncdata', this.cdata);
            this.cdata = '';
            break;
          case 'script':
            this.emitNode('onscript', this.script);
            this.script = '';
            break;
          default:
            this.errorFunction(`Max buffer length exceeded: ${this.BUFFERS[i]}`);
        }
      }
      maxActual = Math.max(maxActual, len);
    }
    // schedule the next check for the earliest possible buffer overrun.
    const m = this.opt.MAX_BUFFER_LENGTH - maxActual;
    this.bufferCheckPosition = m + this.position;
  }

  private openTag(selfClosing?: boolean): void {
    if (this.opt.xmlns) {
      // emit namespace binding events
      const tag = this.tag;

      // add namespace info to tag
      const qn = SAX.qname(this.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = tag.ns[qn.prefix] || '';

      if (tag.prefix && !tag.uri) {
        this.strictFail(`Unbound namespace prefix: ${JSON.stringify(this.tagName)}`);
        tag.uri = qn.prefix;
      }

      const parent = this.tags[this.tags.length - 1] || this;
      if (tag.ns && parent.ns !== tag.ns) {
        const that = this;
        Object.keys(tag.ns).forEach((p) => {
          that.emitNode('onopennamespace', {
            prefix: p,
            uri: tag.ns[p]
          });
        });
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (let i = 0, l = this.attribList.length; i < l; i++) {
        const nv = this.attribList[i];
        const name = nv[0];
        const value = nv[1];
        const qualName = SAX.qname(name, true);
        const prefix = qualName.prefix;
        const local = qualName.local;
        const uri = prefix === '' ? '' : tag.ns[prefix] || '';
        const a = {
          name,
          value,
          prefix,
          local,
          uri
        };

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          this.strictFail(`Unbound namespace prefix: ${JSON.stringify(prefix)}`);
          a.uri = prefix;
        }
        this.tag.attributes[name] = a;
        this.emitNode('onattribute', a);
      }
      this.attribList.length = 0;
    }

    this.tag.isSelfClosing = Boolean(selfClosing);

    // process the tag
    this.sawRoot = true;
    this.tags.push(this.tag);
    this.emitNode('onopentag', this.tag);
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!this.noscript && this.tagName.toLowerCase() === 'script') {
        this.state = this.S.SCRIPT;
      } else {
        this.state = this.S.TEXT;
      }
      this.tag = null;
      this.tagName = '';
    }
    this.attribName = this.attribValue = '';
    this.attribList.length = 0;
  }

  private closeTag(): void {
    if (!this.tagName) {
      this.strictFail('Weird empty close tag.');
      this.textNode += '</>';
      this.state = this.S.TEXT;
      return;
    }

    if (this.script) {
      if (this.tagName !== 'script') {
        this.script += `</${this.tagName}>`;
        this.tagName = '';
        this.state = this.S.SCRIPT;
        return;
      }
      this.emitNode('onscript', this.script);
      this.script = '';
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    let t = this.tags.length;
    let tagName = this.tagName;
    if (!this.strict) {
      tagName = tagName[this.looseCase]();
    }
    while (t--) {
      const close = this.tags[t];
      if (close.name !== tagName) {
        // fail the first time in strict mode
        this.strictFail('Unexpected close tag');
      } else {
        break;
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      this.strictFail(`Unmatched closing tag: ${this.tagName}`);
      this.textNode += `</${this.tagName}>`;
      this.state = this.S.TEXT;
      return;
    }
    this.tagName = tagName;
    let s = this.tags.length;
    while (s-- > t) {
      const tag = (this.tag = this.tags.pop());
      this.tagName = this.tag.name;
      this.emitNode('onclosetag', this.tagName);

      const x: {[index: string]: any} = {};
      for (const i in tag.ns) {
        if (tag.ns.hasOwnProperty(i)) {
          x[i] = tag.ns[i];
        }
      }

      const parent = this.tags[this.tags.length - 1] || this;
      if (this.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        const that = this;
        Object.keys(tag.ns).forEach((p) => {
          const n = tag.ns[p];
          that.emitNode('onclosenamespace', {prefix: p, uri: n});
        });
      }
    }
    if (t === 0) this.closedRoot = true;
    this.tagName = this.attribValue = this.attribName = '';
    this.attribList.length = 0;
    this.state = this.S.TEXT;
  }
}

/**
 *
 * @todo Weird inheritance, with some variables initialized in subclass
 */
export class SAXParser extends SAX {
  static ENTITIES = ENTITIES;

  opt: Required<SAXParserOptions> = DEFAULT_SAX_PARSER_OPTIONS;

  events: Required<SAXEvents> = DEFAULT_SAX_EVENTS;

  constructor(opt?: SAXParserOptions) {
    super();

    this.clearBuffers();

    this.opt = opt = {...this.opt, ...opt};

    this.events = {...this.events, ...opt};

    this.q = this.c = '';
    this.opt.lowercase = this.opt.lowercase || this.opt.lowercasetags;
    this.bufferCheckPosition = this.opt.MAX_BUFFER_LENGTH;
    this.looseCase = this.opt.lowercase ? 'toLowerCase' : 'toUpperCase';
    this.tags = [];
    this.closed = this.closedRoot = this.sawRoot = false;
    this.tag = this.error = null;
    this.strict = Boolean(this.opt.strict);
    this.noscript = Boolean(this.opt.strict || this.opt.noscript);
    this.state = this.S.BEGIN;
    this.strictEntities = this.opt.strictEntities;
    this.ENTITIES = this.strictEntities
      ? Object.create(this.XML_ENTITIES)
      : Object.create(this.ENTITIES);
    this.attribList = [];

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (this.opt.xmlns) {
      this.ns = Object.create(this.rootNS);
    }

    // mostly just for error reporting
    this.trackPosition = this.opt.position !== false;
    if (this.trackPosition) {
      this.position = this.line = this.column = 0;
    }
    this.emit('onready');
  }

  resume(): this {
    this.error = null;
    return this;
  }

  close(): this | SAXParser {
    return this.write(null);
  }

  flush(): void {
    this.flushBuffers();
  }
}
