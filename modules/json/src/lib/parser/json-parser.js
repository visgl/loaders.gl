// @ts-nocheck

import ClarinetParser from '../clarinet/clarinet';
import JSONPath from '../jsonpath/jsonpath';

// JSONParser builds a JSON object using the events emitted by the Clarinet parser

export default class JSONParser {
  constructor() {
    this.reset();
    this._initializeParser();
  }

  reset() {
    this.result = undefined;
    this.previousStates = [];
    this.currentState = Object.freeze({container: [], key: null});
    this.jsonpath = new JSONPath();
  }

  write(chunk) {
    this.parser.write(chunk);
  }

  close() {
    this.parser.close();
  }

  // PRIVATE METHODS

  _pushOrSet(value) {
    const {container, key} = this.currentState;
    if (key !== null) {
      container[key] = value;
      this.currentState.key = null;
    } else {
      container.push(value);
    }
  }

  _openArray(newContainer = []) {
    this.jsonpath.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: true, key: null};
  }

  _closeArray() {
    this.jsonpath.pop();
    this.currentState = this.previousStates.pop();
  }

  _openObject(newContainer = {}) {
    this.jsonpath.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: false, key: null};
  }

  _closeObject() {
    this.jsonpath.pop();
    this.currentState = this.previousStates.pop();
  }

  _initializeParser() {
    this.parser = new ClarinetParser({
      onready: () => {
        this.jsonpath = new JSONPath();
        this.previousStates.length = 0;
        this.currentState.container.length = 0;
      },

      onopenobject: (name) => {
        this._openObject({});
        if (typeof name !== 'undefined') {
          this.parser.onkey(name);
        }
      },

      onkey: (name) => {
        this.jsonpath.set(name);
        this.currentState.key = name;
      },

      oncloseobject: () => {
        this._closeObject();
      },

      onopenarray: () => {
        this._openArray();
      },

      onclosearray: () => {
        this._closeArray();
      },

      onvalue: (value) => {
        this._pushOrSet(value);
      },

      onerror: (error) => {
        throw error;
      },

      onend: () => {
        this.result = this.currentState.container.pop();
      }
    });
  }
}
