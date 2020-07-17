/**
 * Polyfill for Browser Headers
 * Based on https://github.com/github/fetch under MIT license
 */
export default class Headers {
  constructor(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach((value, name) => this.append(name, value));
    } else if (Array.isArray(headers)) {
      headers.forEach(header => this.append(header[0], header[1]));
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(name => this.append(name, headers[name]));
    }
  }

  append(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    const oldValue = this.map[name];
    this.map[name] = oldValue ? `${oldValue}, ${value}` : value;
  }

  delete(name) {
    delete this.map[normalizeName(name)];
  }

  get(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null;
  }

  has(name) {
    return this.map.hasOwnProperty(normalizeName(name));
  }

  set(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  }

  forEach(visitor, thisArg = null) {
    for (const name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        if (thisArg) {
          visitor.call(thisArg, this.map[name], name, this);
        } else {
          visitor(this.map[name], name, this);
        }
      }
    }
  }

  keys() {
    const items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items);
  }

  values() {
    const items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items);
  }

  entries() {
    const items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items);
  }

  *[Symbol.iterator]() {
    // @ts-ignore must have a '[Symbol.iterator]()' method that returns an iterator.
    yield* this.entries();
  }
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name');
  }
  return name.toLowerCase();
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value;
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  const iterator = {
    next() {
      const value = items.shift();
      return {done: value === undefined, value};
    }
  };

  iterator[Symbol.iterator] = function() {
    return iterator;
  };

  return iterator;
}
