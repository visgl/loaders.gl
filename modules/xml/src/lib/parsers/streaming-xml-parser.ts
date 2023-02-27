// @ts-nocheck
/* eslint-disable */

import {SAXParser, SAXParserOptions} from '../../sax-ts/sax';
// import JSONPath from '../jsonpath/jsonpath';

export type StreamingXMLParserOptions = SAXParserOptions;

/**
 * StreamingXMLParser builds a JSON object using the events emitted by the SAX parser
 */
export class StreamingXMLParser {
  readonly parser: SAXParser;
  result = undefined;
  previousStates = [];
  currentState = Object.freeze({container: [], key: null});
  // jsonpath: JSONPath = new JSONPath();

  constructor(options: SAXParserOptions) {
    this.reset();
    this.parser = new SAXParser({
      onready: () => {
        this.previousStates.length = 0;
        this.currentState.container.length = 0;
      },

      onopentag: ({name, attributes, isSelfClosing}) => {
        this._openObject({});
        if (typeof name !== 'undefined') {
          this.parser.emit('onkey', name);
        }
      },

      onkey: (name) => {
        this.currentState.key = name;
      },

      onclosetag: () => {
        this._closeObject();
      },

      onopenarray: () => {
        this._openArray();
      },

      onclosearray: () => {
        this._closeArray();
      },

      ontext: (value) => {
        this._pushOrSet(value);
      },

      onerror: (error) => {
        throw error;
      },

      onend: () => {
        this.result = this.currentState.container.pop();
      },

      ...options
    });
  }

  reset(): void {
    this.result = undefined;
    this.previousStates = [];
    this.currentState = Object.freeze({container: [], key: null});
  }

  write(chunk): void {
    this.parser.write(chunk);
  }

  close(): void {
    this.parser.close();
  }

  // PRIVATE METHODS

  _pushOrSet(value): void {
    const {container, key} = this.currentState;
    if (key !== null) {
      container[key] = value;
      this.currentState.key = null;
    } else if (Array.isArray(container)) {
      container.push(value);
    } else if (container) {
      // debugger
    }
  }

  _openArray(newContainer = []): void {
    // this.jsonpath.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: true, key: null};
  }

  _closeArray(): void {
    // this.jsonpath.pop();
    this.currentState = this.previousStates.pop();
  }

  _openObject(newContainer = {}): void {
    // this.jsonpath.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: false, key: null};
  }

  _closeObject(): void {
    // this.jsonpath.pop();
    this.currentState = this.previousStates.pop();
  }
}
