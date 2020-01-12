import ClarinetParser from '../clarinet/clarinet';

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

  _openContainer(newContainer) {
    this._pushOrSet(newContainer);
    this.previousStates.push(this.currentState);
    this.currentState = {container: newContainer, key: null};
  }

  _closeContainer() {
    this.currentState = this.previousStates.pop();
  }

  _initializeParser() {
    this.parser = new ClarinetParser({
      onready: () => {
        this.previousStates.length = 0;
        this.currentState.container.length = 0;
      },

      onopenobject: name => {
        this._openContainer({});
        if (typeof name !== 'undefined') {
          this.parser.onkey(name);
        }
      },

      onkey: name => {
        this.currentState.key = name;
      },

      oncloseobject: () => {
        this._closeContainer();
      },

      onopenarray: () => {
        this._openContainer([]);
      },

      onclosearray: () => {
        this._closeContainer();
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
