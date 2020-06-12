import ClarinetParser from '../clarinet/clarinet';

// JSONParser builds a JSON object using the events emitted by the Clarinet parser
export default class JSONParser {
  constructor() {
    this.reset();
    this._initializeParser();
  }

  reset(options = {}) {
    this.jsonpaths = options.jsonpaths || {};
    this.result = undefined;
    this.previousStates = [];
    this.currentState = Object.freeze({container: [], key: null});
    this.path = [];
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
    this.path.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: true, key: null};
  }

  _closeArray() {
    this.path.pop();
    this.currentState = this.previousStates.pop();
  }

  _openObject(newContainer = {}) {
    this.path.push(null);
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, isArray: false, key: null};
  }

  _closeObject() {
    this.path.pop();
    this.currentState = this.previousStates.pop();
  }

  _initializeParser() {
    this.parser = new ClarinetParser({
      onready: () => {
        this.path= [];
        this.previousStates.length = 0;
        this.currentState.container.length = 0;
      },

      onopenobject: name => {
        this._openObject({});
        if (typeof name !== 'undefined') {
          this.parser.onkey(name);
        }
      },

      onkey: name => {
        this.path[this.path.length - 1] = name;
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

      onvalue: value => {
        this._pushOrSet(value);
      },

      onerror: error => {
        throw error;
      },

      onend: () => {
        this.result = this.currentState.container.pop();
      }
    });
  }
}
